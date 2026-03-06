<?php

namespace App\Http\Controllers;

use App\Services\StatsService;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    protected $statsService;

    public function __construct(StatsService $statsService)
    {
        $this->statsService = $statsService;
    }

    public function getStats(Request $request)
    {
        return response()->json($this->statsService->getStats($request->query('date')));
    }

    public function getTopInvestors(Request $request)
    {
        $limit = $request->query('limit', 10);
        return response()->json($this->statsService->getTopInvestors($request->query('date'), $limit));
    }

    public function getLocalVsForeign(Request $request)
    {
        return response()->json($this->statsService->getLocalVsForeign($request->query('date')));
    }

    public function getInvestorTypes(Request $request)
    {
        return response()->json($this->statsService->getInvestorTypes($request->query('date')));
    }

    public function getMostDistributed(Request $request)
    {
        $limit = $request->query('limit', 10);
        return response()->json($this->statsService->getMostDistributed($request->query('date'), $limit));
    }
}
