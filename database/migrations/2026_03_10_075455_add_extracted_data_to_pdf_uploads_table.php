<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pdf_uploads', function (Blueprint $table) {
            $table->longText('extracted_data')->nullable()->after('error_message');
        });
    }

    public function down(): void
    {
        Schema::table('pdf_uploads', function (Blueprint $table) {
            $table->dropColumn('extracted_data');
        });
    }
};
