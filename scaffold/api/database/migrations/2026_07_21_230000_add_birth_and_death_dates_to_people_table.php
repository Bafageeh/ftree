<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('people', function (Blueprint $table): void {
            $table->date('birth_date')->nullable()->after('mobile_number');
            $table->date('death_date')->nullable()->after('birth_date');
        });

        DB::table('people')->update(['is_living' => true]);
    }

    public function down(): void
    {
        Schema::table('people', function (Blueprint $table): void {
            $table->dropColumn(['birth_date', 'death_date']);
        });
    }
};
