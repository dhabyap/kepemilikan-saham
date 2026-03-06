<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\PriceSyncService;

class SyncStockPrices extends Command
{
    protected $signature = 'stock:sync-prices';
    protected $description = 'Sync stock prices from Yahoo Finance';

    public function handle(PriceSyncService $priceSyncService)
    {
        $this->info('Starting stock price sync...');
        $priceSyncService->syncAllActiveStocks();
        $this->info('Stock price sync completed.');
    }
}
