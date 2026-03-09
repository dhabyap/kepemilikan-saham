<?php

namespace App\Http\Controllers;

use App\Services\KonglomeratService;
use Illuminate\Http\Request;

class KonglomeratController extends Controller
{
    protected $konglomeratService;

    public function __construct(KonglomeratService $konglomeratService)
    {
        $this->konglomeratService = $konglomeratService;
    }

    public function getAll()
    {
        return response()->json($this->konglomeratService->getAll());
    }

    public function create(Request $request)
    {
        $conglomerate = $this->konglomeratService->create($request->all());
        return response()->json(['success' => true, 'message' => 'Konglomerat created', 'id' => $conglomerate->id]);
    }

    public function update($id, Request $request)
    {
        $this->konglomeratService->update($id, $request->all());
        return response()->json(['success' => true, 'message' => 'Konglomerat updated']);
    }

    public function delete($id)
    {
        $this->konglomeratService->delete($id);
        return response()->json(['success' => true, 'message' => 'Konglomerat deleted']);
    }
}
