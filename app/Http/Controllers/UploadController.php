<?php

namespace App\Http\Controllers;

use App\Services\UploadService;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    protected $uploadService;

    public function __construct(UploadService $uploadService)
    {
        $this->uploadService = $uploadService;
    }

    public function uploadPdf(Request $request)
    {
        \Illuminate\Support\Facades\Log::info("UploadController: Request received at " . now()->toDateTimeString());

        if (!$request->hasFile('pdfFile')) {
            \Illuminate\Support\Facades\Log::warning("UploadController: No file found in request.");
            return response()->json(['error' => 'No PDF file uploaded'], 400);
        }

        $file = $request->file('pdfFile');
        \Illuminate\Support\Facades\Log::info("UploadController: File detected. Name: " . $file->getClientOriginalName() . " Size: " . $file->getSize() . " bytes");

        try {
            $result = $this->uploadService->processPdf($request->file('pdfFile'));
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Upload failed',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getUploadStatus($id)
    {
        $upload = \App\Models\PdfUpload::findOrFail($id);
        return response()->json($upload);
    }

    public function getAllUploads()
    {
        return response()->json(\App\Models\PdfUpload::orderBy('created_at', 'desc')->limit(10)->get());
    }
}
