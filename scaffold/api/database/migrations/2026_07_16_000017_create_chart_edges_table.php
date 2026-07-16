<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_edges', function (Blueprint $table): void {
            $table->id();
            $table->string('from_source_key');
            $table->string('to_source_key');
            $table->string('relation_type')->default('lineage');
            $table->string('reading_status')->default('review');
            $table->unsignedTinyInteger('confidence')->default(50);
            $table->string('approval_status')->default('pending_supervisor');
            $table->string('source_locator')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(
                ['from_source_key', 'to_source_key', 'relation_type'],
                'chart_edges_unique_relation'
            );
            $table->index('from_source_key');
            $table->index('to_source_key');
            $table->index(['approval_status', 'reading_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chart_edges');
    }
};
