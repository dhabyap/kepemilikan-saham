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
        if (!$request->hasFile('pdfFile')) {
            return response()->json(['error' => 'No PDF file uploaded'], 400);
        }

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
