<?php

namespace App\Services;

use App\Models\Saham;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Illuminate\Support\Facades\File;

class UploadService
{
    public function processPdf($file)
    {
        $pdfPath = $file->getRealPath();
        $jsonPath = storage_path('app/uploads/data_' . time() . '.json');

        if (!File::exists(storage_path('app/uploads'))) {
            File::makeDirectory(storage_path('app/uploads'), 0755, true);
        }

        $scriptPath = base_path('extract_data.py');

        // Use 'python' or 'python3' depending on environment
        $process = new Process(['python', $scriptPath, $pdfPath, $jsonPath]);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \Exception('Data extraction failed: ' . $process->getErrorOutput());
        }

        if (!File::exists($jsonPath)) {
            throw new \Exception('JSON output not found from extraction script');
        }

        $jsonData = File::get($jsonPath);
        $records = json_decode($jsonData, true);

        if (empty($records)) {
            throw new \Exception('No records extracted from PDF');
        }

        DB::beginTransaction();
        try {
            Saham::truncate();

            $chunks = array_chunk($records, 1000);
            foreach ($chunks as $chunk) {
                Saham::insert($chunk);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw new \Exception('Failed to save data: ' . $e->getMessage());
        } finally {
            File::delete($jsonPath);
        }

        return ['count' => count($records)];
    }
}
