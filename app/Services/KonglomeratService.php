<?php

namespace App\Services;

use App\Models\Conglomerate;

class KonglomeratService
{
    /**
     * Get all conglomerates ordered by name.
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAll()
    {
        return Conglomerate::orderBy('nama', 'asc')->get();
    }

    /**
     * Create a new conglomerate.
     * 
     * @param array $data
     * @return Conglomerate
     */
    public function create(array $data)
    {
        return Conglomerate::create($data);
    }

    /**
     * Update an existing conglomerate.
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, array $data)
    {
        $conglomerate = Conglomerate::findOrFail($id);
        return $conglomerate->update($data);
    }

    /**
     * Delete a conglomerate.
     * 
     * @param int $id
     * @return bool|null
     */
    public function delete($id)
    {
        $conglomerate = Conglomerate::findOrFail($id);
        return $conglomerate->delete();
    }
}
