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
        'status',
        'error_message',
        'processed_count'
    ];
}
