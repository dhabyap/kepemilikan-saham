<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Clear failed jobs table
DB::table('failed_jobs')->truncate();
echo "Cleared failed_jobs table.\n";

// Re-dispatch all pending uploads
$pendingUploads = \App\Models\PdfUpload::where('status', 'pending')->get();
echo "Found {$pendingUploads->count()} pending uploads.\n";

foreach ($pendingUploads as $upload) {
    \App\Jobs\ProcessPdfJob::dispatch($upload);
    echo "Dispatched job for upload ID: {$upload->id} ({$upload->original_name})\n";
}

echo "\nDone! Total jobs now in queue: " . DB::table('jobs')->count() . "\n";
