<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_readings', function (Blueprint $table) {
            $table->id();
            $table->string('source_key', 120)->unique();
            $table->string('provisional_name', 220);
            $table->string('normalized_name', 220)->nullable()->index();
            $table->string('parent_source_key', 120)->nullable()->index();
            $table->string('chart_branch', 80)->nullable()->index();
            $table->string('chart_color', 20)->nullable();
            $table->string('node_type', 32)->default('person')->index();
            $table->string('reading_status', 24)->default('review')->index();
            $table->unsignedTinyInteger('confidence')->default(50);
            $table->string('source_locator', 255)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_promoted')->default(false)->index();
            $table->foreignId('person_id')->nullable()->constrained('people')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chart_readings');
    }
};
