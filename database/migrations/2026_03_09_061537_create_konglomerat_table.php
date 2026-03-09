<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('konglomerat')) {
            Schema::create('konglomerat', function (Blueprint $table) {
                $table->id();
                $table->string('nama', 255);
                $table->string('nama_grup', 255)->nullable();
                $table->json('stocks')->nullable();
                $table->json('sector')->nullable();
                $table->string('role', 255)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('konglomerat');
    }
};
