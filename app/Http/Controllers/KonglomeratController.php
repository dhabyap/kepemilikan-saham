<?php

namespace App\Http\Controllers;

use App\Models\Conglomerate;
use Illuminate\Http\Request;

class KonglomeratController extends Controller
{
    public function getAll()
    {
        return response()->json(Conglomerate::orderBy('nama', 'asc')->get());
    }

    public function create(Request $request)
    {
        $conglomerate = Conglomerate::create($request->all());
        return response()->json(['success' => true, 'message' => 'Konglomerat created', 'id' => $conglomerate->id]);
    }

    public function update($id, Request $request)
    {
        $conglomerate = Conglomerate::findOrFail($id);
        $conglomerate->update($request->all());
        return response()->json(['success' => true, 'message' => 'Konglomerat updated']);
    }

    public function delete($id)
    {
        $conglomerate = Conglomerate::findOrFail($id);
        $conglomerate->delete();
        return response()->json(['success' => true, 'message' => 'Konglomerat deleted']);
    }
}
