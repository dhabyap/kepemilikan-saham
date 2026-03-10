<?php

namespace App\Services;

use App\Models\Saham;
use App\Models\StockPrice;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PriceSyncService
{
    public function fetchPriceFromYahoo($symbol)
    {
        try {
            $ticker = strtoupper($symbol) . '.JK';
            $url = "https://query1.finance.yahoo.com/v8/finance/chart/{$ticker}";

            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ])->get($url);

            if ($response->failed()) {
                return null;
            }

            $result = $response->json();
            $meta = $result['chart']['result'][0]['meta'] ?? null;

            if (!$meta) {
                return null;
            }

            return [
                'price' => $meta['regularMarketPrice'],
                'previous_close' => $meta['chartPreviousClose'],
                'symbol' => strtoupper($symbol),
                'timestamp' => $meta['regularMarketTime']
            ];
        } catch (\Exception $e) {
            Log::error("[PriceSync] Failed to fetch {$symbol}: " . $e->getMessage());
            return null;
        }
    }

    public function updateStockPrice($data)
    {
        if (!$data)
            return;

        $changePct = $data['previous_close']
            ? (($data['price'] - $data['previous_close']) / $data['previous_close']) * 100
            : 0;

        StockPrice::updateOrCreate(
            ['share_code' => $data['symbol']],
            [
                'price' => $data['price'],
                'previous_close' => $data['previous_close'],
                'change_percent' => $changePct,
                'last_updated' => now()
            ]
        );
    }

    public function syncAllActiveStocks()
    {
        Log::info('[PriceSync] Syncing all active stocks...');
        $stocks = Saham::select('share_code')->distinct()->get();

        foreach ($stocks as $row) {
            $symbol = $row->share_code;
            $data = $this->fetchPriceFromYahoo($symbol);

            if ($data) {
                $this->updateStockPrice($data);
                Log::info("[PriceSync] Updated {$symbol}: Rp " . $data['price']);
            }

            // Respectful delay
            usleep(500000); // 0.5s
        }

        Log::info("[PriceSync] Completed sync for " . $stocks->count() . " stocks");
    }
}
