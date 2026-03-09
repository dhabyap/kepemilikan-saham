<?php

namespace App\Services;

use App\Models\PdfUpload;
use App\Jobs\ProcessPdfJob;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadService
{
    public function processPdf($file)
    {
        $originalName = $file->getClientOriginalName();
        $fileName = time() . '_' . Str::random(10) . '.pdf';

        // Save file to storage
        $path = $file->storeAs('uploads/pdfs', $fileName);

        // Create tracking record
        $pdfUpload = PdfUpload::create([
            'file_path' => $path,
            'original_name' => $originalName,
            'status' => 'pending'
        ]);

        // Dispatch Job
        ProcessPdfJob::dispatch($pdfUpload);

        return [
            'success' => true,
            'message' => 'Upload successful. PDF is being processed in the background.',
            'upload_id' => $pdfUpload->id
        ];
    }
}
