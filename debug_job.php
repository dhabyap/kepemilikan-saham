<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$uploads = \App\Models\PdfUpload::where('status', 'processing')->get();

foreach ($uploads as $upload) {
    echo "Processing upload ID: {$upload->id}\n";
    try {
        $job = new \App\Jobs\ProcessPdfJob($upload);
        $job->handle();
        echo "Job executed successfully for upload ID: {$upload->id}\n";
    } catch (\Throwable $e) {
        echo "Exception for upload ID {$upload->id}: {$e->getMessage()}\n";
        echo $e->getTraceAsString() . "\n";
    }
}
