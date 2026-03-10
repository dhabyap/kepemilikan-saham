<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockPrice extends Model
{
    use HasFactory;

    protected $table = 'stock_prices';
    protected $primaryKey = 'share_code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'share_code', 'price', 'previous_close', 'change_percent', 'last_updated'
    ];
}
