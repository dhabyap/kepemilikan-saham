<?php

namespace App\Http\Controllers;

use App\Services\SahamService;
use App\Models\StockPrice;
use App\Models\Saham;
use Illuminate\Http\Request;

class SahamController extends Controller
{
    protected $sahamService;

    public function __construct(SahamService $sahamService)
    {
        $this->sahamService = $sahamService;
    }

    public function getDates()
    {
        return response()->json($this->sahamService->getDates());
    }

    public function getInvestorDetail($name, Request $request)
    {
        $data = $this->sahamService->getInvestorDetail($name, $request->query('date'));
        return response()->json($data);
    }

    public function searchInvestors(Request $request)
    {
        $data = $this->sahamService->searchInvestors($request->query('q'), $request->query('date'));
        return response()->json($data);
    }

    public function getInvestorNetwork(Request $request)
    {
        $investor = $request->query('investor');
        if (!$investor) {
            return response()->json(['error' => 'investor query param required'], 400);
        }
        $data = $this->sahamService->getInvestorNetwork($investor, $request->query('date'));
        return response()->json($data);
    }

    public function getStockPrices()
    {
        return response()->json(StockPrice::all());
    }

    public function getTopHoldings(Request $request)
    {
        $limit = $request->query('limit', 20);
        $data = Saham::where('date', $request->query('date', $this->sahamService->getLatestDate()))
            ->orderBy('percentage', 'desc')
            ->limit($limit)
            ->get();
        return response()->json($data);
    }

    public function getFractionalOwners(Request $request)
    {
        $limit = $request->query('limit', 30);
        $data = Saham::where('date', $request->query('date', $this->sahamService->getLatestDate()))
            ->where('percentage', '>=', 1.00)
            ->where('percentage', '<', 6.00)
            ->orderBy('percentage', 'desc')
            ->limit($limit)
            ->get();
        return response()->json($data);
    }

    public function getIssuers(Request $request)
    {
        $date = $request->query('date', $this->sahamService->getLatestDate());
        $data = Saham::where('date', $date)
            ->select('share_code')
            ->selectRaw('MAX(issuer_name) as issuer_name')
            ->selectRaw('COUNT(*) as investor_count')
            ->selectRaw('SUM(total_holding_shares) as total_shares')
            ->selectRaw('ROUND(SUM(percentage), 2) as total_tracked_pct')
            ->selectRaw('MAX(percentage) as largest_pct')
            ->selectRaw('GROUP_CONCAT(DISTINCT local_foreign) as ownership_types')
            ->groupBy('share_code')
            ->orderBy('share_code')
            ->get();
        return response()->json($data);
    }

    public function getIssuerDetail($code, Request $request)
    {
        $data = Saham::where('share_code', $code)
            ->where('date', $request->query('date', $this->sahamService->getLatestDate()))
            ->orderBy('percentage', 'desc')
            ->get();
        return response()->json($data);
    }

    public function search(Request $request)
    {
        $q = $request->query('q');
        $date = $request->query('date', $this->sahamService->getLatestDate());

        $data = Saham::where(function ($query) use ($q) {
            $query->where('share_code', 'LIKE', "%{$q}%")
                ->orWhere('issuer_name', 'LIKE', "%{$q}%")
                ->orWhere('investor_name', 'LIKE', "%{$q}%");
        })
            ->where('date', $date)
            ->orderBy('percentage', 'desc')
            ->limit(50)
            ->get();
        return response()->json($data);
    }

    public function updateSaham($id, Request $request)
    {
        $saham = Saham::findOrFail($id);
        $saham->update($request->all());
        return response()->json(['success' => true, 'message' => 'Saham updated']);
    }

    public function deleteSaham($id)
    {
        $saham = Saham::findOrFail($id);
        $saham->delete();
        return response()->json(['success' => true, 'message' => 'Saham deleted']);
    }
}
