<?php

use App\Services\ChartReadingPromoter;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(ChartReadingPromoter::class)->promoteAll();
    }

    public function down(): void
    {
        // Keep the digitized records. A rollback must not discard reviewed genealogy data.
    }
};
