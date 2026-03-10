<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ConglomerateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = base_path('konglomerat.json');
        if (!file_exists($jsonPath)) {
            $this->command->error("File konglomerat.json not found!");
            return;
        }

        $jsonData = file_get_contents($jsonPath);
        $conglomerates = json_decode($jsonData, true);

        if (!$conglomerates) {
            $this->command->error("Failed to decode konglomerat.json!");
            return;
        }

        // Use truncate to ensure a clean start for the seeder
        \App\Models\Conglomerate::truncate();

        foreach ($conglomerates as $data) {
            \App\Models\Conglomerate::create([
                'nama' => $data['konglomerat'],
                'nama_grup' => $data['group'] ?? null,
                'stocks' => $data['stocks'] ?? [],
                'sector' => $data['sector'] ?? [],
                'role' => $data['role'] ?? null,
            ]);
        }

        $this->command->info("Successfully seeded " . count($conglomerates) . " conglomerates.");
    }
}
