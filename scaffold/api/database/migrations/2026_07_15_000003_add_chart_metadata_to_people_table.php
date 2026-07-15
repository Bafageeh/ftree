<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('people', function (Blueprint $table) {
            $table->string('node_type', 24)->default('person')->after('full_name')->index();
            $table->string('chart_branch', 64)->nullable()->after('status')->index();
            $table->string('chart_color', 24)->nullable()->after('chart_branch');
            $table->string('source_locator', 120)->nullable()->after('source_reference');
            $table->unsignedInteger('chart_order')->nullable()->after('source_locator')->index();
        });
    }

    public function down(): void
    {
        Schema::table('people', function (Blueprint $table) {
            $table->dropIndex(['node_type']);
            $table->dropIndex(['chart_branch']);
            $table->dropIndex(['chart_order']);
            $table->dropColumn([
                'node_type',
                'chart_branch',
                'chart_color',
                'source_locator',
                'chart_order',
            ]);
        });
    }
};
