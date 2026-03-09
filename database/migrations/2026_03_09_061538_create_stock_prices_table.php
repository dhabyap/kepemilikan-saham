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
        if (!Schema::hasTable('stock_prices')) {
            Schema::create('stock_prices', function (Blueprint $table) {
                $table->string('share_code', 20)->primary();
                $table->decimal('price', 15, 2)->default(0);
                $table->decimal('previous_close', 15, 2)->default(0);
                $table->float('change_percent')->default(0);
                $table->timestamp('last_updated')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_prices');
    }
};
