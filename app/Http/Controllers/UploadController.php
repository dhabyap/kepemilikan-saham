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
            return response()->json([
                'success' => true,
                'message' => "Successfully imported {$result['count']} records"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Upload failed',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
