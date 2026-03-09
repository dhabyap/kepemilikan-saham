<?php

namespace App\Services;

use App\Models\PdfUpload;
use App\Jobs\ProcessPdfJob;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadService
{
    /**
     * Handle the file upload and dispatch the background job.
     * This method must be extremely fast to avoid web server timeouts.
     */
    public function processPdf($file)
    {
        $originalName = $file->getClientOriginalName();
        $fileName = time() . '_' . Str::random(10) . '.pdf';

        // Phase 1: FAST FILE SAVE
        // We save the file quickly and return. NO EXTRACTION happens here.
        $path = $file->storeAs('uploads/pdfs', $fileName);

        // Phase 2: CREATE TRACKING RECORD
        $pdfUpload = PdfUpload::create([
            'file_path' => $path,
            'original_name' => $originalName,
            'status' => 'pending'
        ]);

        // Phase 3: DISPATCH BACKGROUND JOB
        // ProcessPdfJob will handle both Extraction (JSON) and Insertion.
        ProcessPdfJob::dispatch($pdfUpload);

        return [
            'success' => true,
            'message' => 'Upload successful! File is being processed in the background.',
            'upload_id' => $pdfUpload->id
        ];
    }
}
