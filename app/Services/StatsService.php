<?php

namespace App\Services;

use App\Models\Saham;
use Illuminate\Support\Facades\DB;

class StatsService
{
    protected $sahamService;

    public function __construct(SahamService $sahamService)
    {
        $this->sahamService = $sahamService;
    }

    private function getActiveDate($date)
    {
        return $date ?: $this->sahamService->getLatestDate();
    }

    public function getStats($date = null)
    {
        $activeDate = $this->getActiveDate($date);

        return Saham::where('date', $activeDate)
            ->selectRaw('COUNT(*) as total_records')
            ->selectRaw('COUNT(DISTINCT share_code) as total_issuers')
            ->selectRaw('COUNT(DISTINCT investor_name) as total_investors')
            ->selectRaw('ROUND(AVG(percentage), 2) as avg_percentage')
            ->selectRaw('MAX(percentage) as max_percentage')
            ->first();
    }

    public function getTopInvestors($date = null, $limit = 10)
    {
        $activeDate = $this->getActiveDate($date);

        return Saham::where('date', $activeDate)
            ->select('investor_name')
            ->selectRaw('MAX(investor_type) as investor_type')
            ->selectRaw('MAX(local_foreign) as local_foreign')
            ->selectRaw('COUNT(DISTINCT share_code) as companies_count')
            ->selectRaw('SUM(total_holding_shares) as total_shares')
            ->selectRaw('ROUND(AVG(percentage), 2) as avg_percentage')
            ->groupBy('investor_name')
            ->orderByDesc('companies_count')
            ->orderByDesc('total_shares')
            ->limit($limit)
            ->get();
    }

    public function getLocalVsForeign($date = null)
    {
        $activeDate = $this->getActiveDate($date);

        return Saham::where('date', $activeDate)
            ->selectRaw("CASE 
                WHEN local_foreign = 'L' THEN 'Lokal'
                WHEN local_foreign = 'A' THEN 'Asing'
                ELSE 'Tidak Diketahui'
            END as category")
            ->selectRaw('COUNT(*) as record_count')
            ->selectRaw('COUNT(DISTINCT investor_name) as investor_count')
            ->selectRaw('COUNT(DISTINCT share_code) as issuer_count')
            ->selectRaw('SUM(total_holding_shares) as total_shares')
            ->selectRaw('ROUND(AVG(percentage), 2) as avg_percentage')
            ->groupBy('local_foreign')
            ->orderByDesc('total_shares')
            ->get();
    }

    public function getInvestorTypes($date = null)
    {
        $activeDate = $this->getActiveDate($date);

        return Saham::where('date', $activeDate)
            ->selectRaw("CASE 
                WHEN TRIM(investor_type) = 'CP' THEN 'Korporat'
                WHEN TRIM(investor_type) = 'ID' THEN 'Individu'
                WHEN TRIM(investor_type) = 'IB' THEN 'Inv. Banking'
                WHEN TRIM(investor_type) = 'IS' THEN 'Asuransi'
                WHEN TRIM(investor_type) = 'SC' THEN 'Sekuritas'
                WHEN TRIM(investor_type) = 'FD' THEN 'Yayasan'
                WHEN TRIM(investor_type) = 'MF' THEN 'Reksadana'
                WHEN TRIM(investor_type) = 'PF' THEN 'Dapen'
                ELSE 'Lainnya'
            END as type_label")
            ->selectRaw('MAX(investor_type) as type_code')
            ->selectRaw('COUNT(*) as record_count')
            ->selectRaw('COUNT(DISTINCT investor_name) as investor_count')
            ->selectRaw('COUNT(DISTINCT share_code) as issuer_count')
            ->selectRaw('SUM(total_holding_shares) as total_shares')
            ->selectRaw('ROUND(AVG(percentage), 2) as avg_percentage')
            ->groupBy('type_label')
            ->orderByDesc('record_count')
            ->get();
    }

    public function getMostDistributed($date = null, $limit = 10)
    {
        $activeDate = $this->getActiveDate($date);

        return Saham::where('date', $activeDate)
            ->select('share_code')
            ->selectRaw('MAX(issuer_name) as issuer_name')
            ->selectRaw('COUNT(*) as shareholder_count')
            ->selectRaw('ROUND(SUM(percentage), 2) as total_tracked_pct')
            ->selectRaw('MAX(percentage) as largest_holding_pct')
            ->selectRaw('MIN(percentage) as smallest_holding_pct')
            ->groupBy('share_code')
            ->orderByDesc('shareholder_count')
            ->limit($limit)
            ->get();
    }
}
