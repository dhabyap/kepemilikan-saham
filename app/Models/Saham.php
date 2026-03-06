<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Saham extends Model
{
    use HasFactory;

    protected $table = 'kepemilikan_saham';
    public $timestamps = false;

    protected $fillable = [
        'date', 'share_code', 'issuer_name', 'investor_name', 'investor_address',
        'investor_city', 'investor_zip', 'investor_country', 'investor_type',
        'local_foreign', 'shares_scrip', 'shares_scripless', 'total_holding_shares',
        'percentage'
    ];
}
