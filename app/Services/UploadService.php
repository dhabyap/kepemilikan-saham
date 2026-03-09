<?php

namespace App\Services;

use App\Models\PdfUpload;
use App\Jobs\ProcessPdfJob;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class UploadService
{
    /**
     * Handle the file upload and dispatch the background job.
     * This method must be extremely fast to avoid web server timeouts.
     */
    public function processPdf($file)
    {
        $startTime = microtime(true);
        $connection = config('queue.default');

        Log::info("UploadService: [START] Processing file. Connection: $connection");
        Log::info("UploadService: Server Limits - Max Execution: " . ini_get('max_execution_time') . "s, Memory: " . ini_get('memory_limit'));

        $originalName = $file->getClientOriginalName();
        $fileName = time() . '_' . Str::random(10) . '.pdf';

        // Phase 1: FAST FILE SAVE
        // Jika file sangat besar (>50MB), proses penyimpanan ini bisa memakan waktu di server yang lambat.
        Log::info("UploadService: Storing file locally...");
        $path = $file->storeAs('uploads/pdfs', $fileName);
        Log::info("UploadService: File stored at $path in " . (microtime(true) - $startTime) . " seconds");

        // Phase 2: CREATE TRACKING RECORD
        $pdfUpload = PdfUpload::create([
            'file_path' => $path,
            'original_name' => $originalName,
            'status' => 'pending'
        ]);

        // Phase 3: DISPATCH BACKGROUND JOB
        // JIKA connection == 'sync', maka proses PDF akan dilakukan SEKARANG (menyebabkan timeout).
        // JIKA connection == 'database', maka proses PDF akan dilakukan di background (aman dari timeout).
        ProcessPdfJob::dispatch($pdfUpload);
        Log::info("UploadService: Job dispatched successfully. Returning response to browser.");

        return [
            'success' => true,
            'message' => 'Upload successful! File is being processed in the background.',
            'upload_id' => $pdfUpload->id,
            'debug_queue' => $connection // Berikan info ke frontend untuk debug
        ];
    }
}