<?php

namespace App\Jobs;

use App\Models\Saham;
use App\Models\PdfUpload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;

class ProcessPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $pdfUpload;

    public function __construct(PdfUpload $pdfUpload)
    {
        $this->pdfUpload = $pdfUpload;
    }

    public function handle(): void
    {
        $this->pdfUpload->update(['status' => 'processing']);

        try {
            // Increase limits for background processing
            set_time_limit(0);
            ini_set('memory_limit', '1024M');

            $pdfPath = storage_path('app/' . $this->pdfUpload->file_path);

            if (!file_exists($pdfPath)) {
                throw new \Exception("File not found at: " . $pdfPath);
            }

            $parser = new Parser();
            $pdf = $parser->parseFile($pdfPath);

            $allRecords = [];
            $seen = [];

            $pages = $pdf->getPages();
            foreach ($pages as $page) {
                $text = $page->getText();
                $lines = explode("\n", $text);

                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line))
                        continue;

                    // Date pattern: XX-XXX-XXXX
                    if (!preg_match('/^(\d{2}-[A-Za-z]{3}-\d{2,4})/', $line, $dateMatches)) {
                        continue;
                    }

                    $date = $dateMatches[1];
                    $remaining = trim(substr($line, strlen($date)));

                    // Share Code (4 letters)
                    if (!preg_match('/^([A-Z]{4})\s+/', $remaining, $codeMatches)) {
                        continue;
                    }
                    $shareCode = $codeMatches[1];
                    $remaining = trim(substr($remaining, strlen($shareCode)));

                    preg_match_all('/[\d.,]+/', $remaining, $numMatches);
                    $numbers = $numMatches[0];
                    if (count($numbers) < 4)
                        continue;

                    $percentageRaw = array_pop($numbers);
                    $totalSharesRaw = array_pop($numbers);
                    $holdingsScripRaw = array_pop($numbers);
                    $holdingsScriplessRaw = array_pop($numbers);

                    if (!preg_match('/\b(CP|ID|IB|IS|SC|FD|MF|PF|OT)\s+(L|A)\b/', $remaining, $anchorMatches, PREG_OFFSET_CAPTURE)) {
                        continue;
                    }

                    $type = $anchorMatches[1][0];
                    $lf = $anchorMatches[2][0];
                    $anchorPos = $anchorMatches[0][1];

                    $beforeAnchor = trim(substr($remaining, 0, $anchorPos));
                    $afterAnchor = trim(substr($remaining, $anchorPos + strlen($anchorMatches[0][0])));

                    if (str_contains($beforeAnchor, ' Tbk ')) {
                        $nameParts = explode(' Tbk ', $beforeAnchor, 2);
                        $issuerName = $nameParts[0] . ' Tbk';
                        $investorName = trim($nameParts[1]);
                    } else {
                        $issuerName = $beforeAnchor;
                        $investorName = $beforeAnchor;
                    }

                    $firstNumPos = strcspn($afterAnchor, '0123456789');
                    $geoInfo = trim(substr($afterAnchor, 0, $firstNumPos));

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

                    $key = "{$record['date']}|{$record['share_code']}|{$record['investor_name']}";
                    if (isset($seen[$key]))
                        continue;
                    $seen[$key] = true;

                    $allRecords[] = $record;
                }
            }

            if (empty($allRecords)) {
                throw new \Exception('No records extracted from PDF. Format mismatch.');
            }

            // Filter duplicates (Historical Data Retention)
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

            $insertedCount = 0;
            if (!empty($recordsToInsert)) {
                $chunks = array_chunk($recordsToInsert, 500);
                foreach ($chunks as $chunk) {
                    Saham::insert($chunk);
                    $insertedCount += count($chunk);
                    $this->pdfUpload->update(['processed_count' => $insertedCount]);
                }
            }

            $this->pdfUpload->update([
                'status' => 'completed',
                'processed_count' => $insertedCount
            ]);

            // Optional: delete PDF after processing
            // Storage::delete($this->pdfUpload->file_path);

        } catch (\Exception $e) {
            Log::error("PDF Processing Job Failed: " . $e->getMessage());
            $this->pdfUpload->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);
        }
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
