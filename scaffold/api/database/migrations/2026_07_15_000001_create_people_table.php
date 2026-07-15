<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('people', function (Blueprint $table) {
            $table->id();
            $table->string('full_name')->index();
            $table->string('honorific')->nullable();
            $table->foreignId('lineage_parent_id')->nullable()->constrained('people')->nullOnDelete();
            $table->string('status', 24)->default('review')->index();
            $table->unsignedSmallInteger('generation')->default(1)->index();
            $table->text('summary')->nullable();
            $table->string('source_reference')->nullable();
            $table->boolean('is_living')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('people');
    }
};
