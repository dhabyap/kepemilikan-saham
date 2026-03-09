<?php

namespace App\Services;

use App\Models\Saham;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;

class UploadService
{
    public function processPdf($file)
    {
        // Increase limits for large PDF files
        set_time_limit(0);
        ini_set('memory_limit', '1024M');

        $pdfPath = $file->getRealPath();

        $parser = new Parser();
        $pdf = $parser->parseFile($pdfPath);

        $allRecords = [];
        $seen = [];

        $pages = $pdf->getPages();
        foreach ($pages as $index => $page) {
            $text = $page->getText();
            $lines = explode("\n", $text);

            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line))
                    continue;

                // Identify the line structure. 
                // A valid row starts with a date pattern: XX-XXX-XXXX
                if (!preg_match('/^(\d{2}-[A-Za-z]{3}-\d{2,4})/', $line, $dateMatches)) {
                    continue;
                }

                $date = $dateMatches[1];
                $remaining = trim(substr($line, strlen($date)));

                // Next is Share Code (4 letters)
                if (!preg_match('/^([A-Z]{4})\s+/', $remaining, $codeMatches)) {
                    continue;
                }
                $shareCode = $codeMatches[1];
                $remaining = trim(substr($remaining, strlen($shareCode)));

                // The end of the line is almost always 4 numeric fields:
                // [Percentage] [Total] [Scrip] [Scripless]
                // Example: ... 3.200.142.830 0 3.200.142.830 41.10
                preg_match_all('/[\d.,]+/', $remaining, $numMatches);
                $numbers = $numMatches[0];

                if (count($numbers) < 4)
                    continue;

                // Take the last 4 numeric groups
                $percentageRaw = array_pop($numbers);
                $totalSharesRaw = array_pop($numbers);
                $holdingsScripRaw = array_pop($numbers);
                $holdingsScriplessRaw = array_pop($numbers);

                // Now we need to find the anchors: Investor Type and Local/Foreign
                // Type: CP, ID, IB, IS, SC, FD, MF, PF, OT
                // LF: L, A
                // These are usually in the middle.
                if (!preg_match('/\b(CP|ID|IB|IS|SC|FD|MF|PF|OT)\s+(L|A)\b/', $remaining, $anchorMatches, PREG_OFFSET_CAPTURE)) {
                    continue;
                }

                $type = $anchorMatches[1][0];
                $lf = $anchorMatches[2][0];
                $anchorPos = $anchorMatches[0][1];

                // Text before anchors is Issuer Name + Investor Name
                $beforeAnchor = trim(substr($remaining, 0, $anchorPos));

                // Text after anchors is Nationality + Domicile + Numbers
                $afterAnchor = trim(substr($remaining, $anchorPos + strlen($anchorMatches[0][0])));

                // Try to split the before-anchor part. 
                // KSEI often has "Issuer Name Tbk Investor Name"
                // This is hard to split perfectly without a list of issuers.
                // For now, we'll try to split by " Tbk " if it exists.
                if (str_contains($beforeAnchor, ' Tbk ')) {
                    $nameParts = explode(' Tbk ', $beforeAnchor, 2);
                    $issuerName = $nameParts[0] . ' Tbk';
                    $investorName = trim($nameParts[1]);
                } else {
                    $issuerName = $beforeAnchor;
                    $investorName = $beforeAnchor;
                }

                // Try to extract Nationality and Domicile from after-anchor
                // Nationality and Domicile are between $lf and the first number.
                $firstNumPos = strcspn($afterAnchor, '0123456789');
                $geoInfo = trim(substr($afterAnchor, 0, $firstNumPos));

                // Simple split geoInfo into Nationality and Domicile (50/50 best effort)
                $geoParts = explode(' ', $geoInfo);
                if (count($geoParts) >= 2) {
                    $nationality = $geoParts[0];
                    $domicile = implode(' ', array_slice($geoParts, 1));
                } else {
                    $nationality = $geoInfo;
                    $domicile = $geoInfo;
                }

                $record = [
                    "date" => $date,
                    "share_code" => $shareCode,
                    "issuer_name" => mb_strcut($issuerName, 0, 255),
                    "investor_name" => mb_strcut($investorName, 0, 255),
                    "investor_type" => $type,
                    "local_foreign" => $lf,
                    "nationality" => mb_strcut($nationality, 0, 100),
                    "domicile" => mb_strcut($domicile, 0, 100),
                    "holdings_scripless" => $this->parseNumber($holdingsScriplessRaw),
                    "holdings_scrip" => $this->parseNumber($holdingsScripRaw),
                    "total_holding_shares" => $this->parseNumber($totalSharesRaw),
                    "percentage" => $this->parsePercentage($percentageRaw),
                ];

                $key = "{$record['share_code']}|{$record['investor_name']}";
                if (isset($seen[$key]))
                    continue;
                $seen[$key] = true;

                $allRecords[] = $record;
            }
        }

        if (empty($allRecords)) {
            Log::error("PDF Extraction failed (No records) for file: " . $file->getClientOriginalName());
            throw new \Exception('No records extracted from PDF. Please check PDF format.');
        }

        // Filter out records that already exist for the given dates in the PDF
        $datesInPdf = array_unique(array_column($allRecords, 'date'));

        $existingRecords = Saham::whereIn('date', $datesInPdf)
            ->select('date', 'share_code', 'investor_name')
            ->get()
            ->map(function ($r) {
                return "{$r->date}|{$r->share_code}|{$r->investor_name}";
            })
            ->flip()
            ->toArray();

        $recordsToInsert = [];
        foreach ($allRecords as $record) {
            $key = "{$record['date']}|{$record['share_code']}|{$record['investor_name']}";
            if (!isset($existingRecords[$key])) {
                $recordsToInsert[] = $record;
            }
        }

        if (empty($recordsToInsert)) {
            return ['count' => 0, 'message' => 'All records already exist in the database.'];
        }

        $insertedCount = 0;
        $chunks = array_chunk($recordsToInsert, 500);
        foreach ($chunks as $chunk) {
            try {
                Saham::insert($chunk);
                $insertedCount += count($chunk);
            } catch (\Exception $e) {
                Log::error("Batch insertion failed: " . $e->getMessage());
                throw new \Exception("Database import partially failed. Successfully inserted $insertedCount records. Error: " . $e->getMessage());
            }
        }

        return ['count' => $insertedCount];
    }

    private function parseNumber($s)
    {
        if (!$s)
            return 0;
        $s = str_replace(['.', ','], ['', '.'], trim($s));
        $s = preg_replace('/[^0-9.]/', '', $s);
        return (int) floatval($s);
    }

    private function parsePercentage($s)
    {
        if (!$s)
            return 0.0;
        $s = str_replace(',', '.', trim($s));
        $s = preg_replace('/[^0-9.]/', '', $s);
        return (float) $s;
    }
}
