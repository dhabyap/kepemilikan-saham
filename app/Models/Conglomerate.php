<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conglomerate extends Model
{
    use HasFactory;

    protected $table = 'konglomerat';
    public $timestamps = false;

    protected $fillable = [
        'nama',
        'nama_grup',
        'stocks',
        'sector',
        'role'
    ];

    protected $casts = [
        'stocks' => 'array',
        'sector' => 'array',
    ];
}
