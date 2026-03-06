<?php

namespace App\Services;

use App\Models\Saham;
use Illuminate\Support\Facades\DB;

class SahamService
{
    public function getDates()
    {
        return Saham::select('date')
            ->distinct()
            ->orderByRaw('STR_TO_DATE(date, "%d-%b-%Y") DESC')
            ->pluck('date');
    }

    public function getLatestDate()
    {
        return Saham::orderByRaw('STR_TO_DATE(date, "%d-%b-%Y") DESC')
            ->value('date');
    }

    public function searchInvestors($query, $date = null)
    {
        $q = Saham::query()
            ->select('investor_name')
            ->distinct()
            ->where('investor_name', 'LIKE', '%' . $query . '%');

        if ($date) {
            $q->where('date', $date);
        }

        return $q->orderBy('investor_name', 'ASC')
            ->limit(10)
            ->get();
    }

    public function getInvestorDetail($name, $date = null)
    {
        $query = Saham::query()
            ->from('kepemilikan_saham as s')
            ->select('s.*', 'p.price as current_price', 'p.previous_close', 'p.change_percent', 'p.market_cap')
            ->selectRaw('COALESCE(s.total_holding_shares * p.price, 0) as market_value')
            ->selectRaw('(
                SELECT COUNT(*) + 1 
                FROM kepemilikan_saham s2 
                WHERE s2.share_code = s.share_code 
                    AND s2.date = s.date 
                    AND s2.percentage > s.percentage
            ) as shareholder_rank')
            ->leftJoin('stock_prices as p', 's.share_code', '=', 'p.share_code')
            ->where('s.investor_name', $name);

        if ($date) {
            $query->where('s.date', $date);
        }

        return $query->orderBy('market_value', 'DESC')->get();
    }

    public function getInvestorNetwork($investorName, $date = null)
    {
        $query = Saham::query()
            ->select('share_code', 'issuer_name', 'percentage', 'local_foreign', 'investor_type')
            ->where('investor_name', $investorName);

        if ($date) {
            $query->where('date', $date);
        }

        $holdings = $query->orderBy('percentage', 'DESC')->limit(50)->get();

        if ($holdings->isEmpty()) {
            return [
                'investor' => $investorName,
                'holdings' => [],
                'peers' => []
            ];
        }

        $codes = $holdings->pluck('share_code')->toArray();

        $peersQuery = Saham::query()
            ->select('investor_name', 'share_code', 'percentage')
            ->whereIn('share_code', $codes)
            ->where('investor_name', '!=', $investorName)
            ->where('percentage', '>=', 5);

        if ($date) {
            $peersQuery->where('date', $date);
        }

        $peers = $peersQuery->limit(30)->get();

        return [
            'investor' => $investorName,
            'holdings' => $holdings,
            'peers' => $peers
        ];
    }
}
