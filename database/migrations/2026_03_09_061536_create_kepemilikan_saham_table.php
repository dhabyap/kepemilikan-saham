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
        Schema::dropIfExists('kepemilikan_saham');
        Schema::create('kepemilikan_saham', function (Blueprint $table) {
            $table->id();
            $table->string('date', 50)->index();
            $table->string('share_code', 20)->index();
            $table->string('issuer_name', 255)->nullable();
            $table->string('investor_name', 255)->index();
            $table->string('investor_type', 20)->nullable();
            $table->string('local_foreign', 20)->nullable();
            $table->string('nationality', 100)->nullable();
            $table->string('domicile', 100)->nullable();
            $table->bigInteger('holdings_scripless')->default(0);
            $table->bigInteger('holdings_scrip')->default(0);
            $table->bigInteger('total_holding_shares')->default(0);
            $table->decimal('percentage', 10, 4)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kepemilikan_saham');
    }
};
