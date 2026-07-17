<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('chart_edges')->update([
            'relation_type' => 'lineage',
        ]);
    }

    public function down(): void
    {
        // This correction is intentionally permanent because every arrow in
        // the source chart represents one continuous father-child lineage.
    }
};
