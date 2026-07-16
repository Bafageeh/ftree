<?php

namespace Database\Seeders;

use App\Services\ChartReadingPromoter;
use Illuminate\Database\Seeder;

class ProvisionalPersonSeeder extends Seeder
{
    public function run(): void
    {
        app(ChartReadingPromoter::class)->promoteAll();
    }
}
