<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PdfUpload extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_path',
        'original_name',
        'extracted_data',
        'status',
        'error_message',
        'processed_count'
    ];

    protected $casts = [
        'extracted_data' => 'array'
    ];
}
