<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$uploads = \App\Models\PdfUpload::orderBy('id', 'desc')->take(5)->get();
foreach ($uploads as $u) {
    echo "ID: {$u->id} | Status: {$u->status}\n";
    echo "Error: {$u->error_message}\n\n";
}
