<?php

namespace App\Services;

use App\Models\Saham;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Smalot\PdfParser\Parser;

class UploadService
{
    public function processPdf($file)
    {
        // Increase limits for large PDF files
        set_time_limit(0);
        ini_set('memory_limit', '512M');

        $pdfPath = $file->getRealPath();

        $parser = new Parser();
        $pdf = $parser->parseFile($pdfPath);

        $allRecords = [];
        $seen = [];

        // Skip the first page often (cover letter in your case)
        $pages = $pdf->getPages();
        foreach ($pages as $index => $page) {
            if ($index === 0)
                continue; // Skip cover letter

            $text = $page->getText();
            $lines = explode("\n", $text);

            foreach ($lines as $line) {
                // Regex to match typical rows: 
                // Mostly look for Share Code (4 letters) followed by some names and numbers
                // Example format from your python: [DATE, SHARE_CODE, ISSUER_NAME, INVESTOR_NAME, ...]

                $parts = preg_split('/\s{2,}/', trim($line)); // Split by 2 or more spaces

                if (count($parts) < 8)
                    continue;

                // Typical share code is 4 uppercase letters
                if (!preg_match('/^[A-Z]{4}$/', $parts[1]))
                    continue;

                $shareCode = $parts[1];
                $investorName = $parts[3] ?? '';

                $key = "{$shareCode}|{$investorName}";
                if (isset($seen[$key]))
                    continue;
                $seen[$key] = true;

                $record = [
                    "date" => $parts[0] ?? '',
                    "share_code" => $shareCode,
                    "issuer_name" => $parts[2] ?? '',
                    "investor_name" => $investorName,
                    "investor_type" => $parts[4] ?? '',
                    "local_foreign" => $parts[5] ?? '',
                    "nationality" => $parts[6] ?? '',
                    "domicile" => $parts[7] ?? '',
                    "holdings_scripless" => $this->parseNumber($parts[8] ?? '0'),
                    "holdings_scrip" => $this->parseNumber($parts[9] ?? '0'),
                    "total_holding_shares" => $this->parseNumber($parts[10] ?? '0'),
                    "percentage" => $this->parsePercentage($parts[11] ?? '0'),
                ];

                $allRecords[] = $record;
            }
        }

        if (empty($allRecords)) {
            throw new \Exception('No records extracted from PDF. Ensure the PDF format is compatible with the parser.');
        }

        DB::beginTransaction();
        try {
            Saham::truncate();

            $chunks = array_chunk($allRecords, 1000);
            foreach ($chunks as $chunk) {
                Saham::insert($chunk);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw new \Exception('Failed to save data: ' . $e->getMessage());
        }

        return ['count' => count($allRecords)];
    }

    private function parseNumber($s)
    {
        if (!$s)
            return 0;
        $s = str_replace(['.', ','], ['', '.'], trim($s));
        return (int) floatval($s);
    }

    private function parsePercentage($s)
    {
        if (!$s)
            return 0.0;
        $s = str_replace(',', '.', trim($s));
        return (float) $s;
    }
}
