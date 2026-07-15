<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_requests', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_code', 24)->unique();
            $table->foreignId('person_id')->nullable()->constrained('people')->nullOnDelete();
            $table->string('request_type', 32)->default('correction')->index();
            $table->string('requester_name', 120);
            $table->string('requester_phone', 40)->nullable();
            $table->string('person_name', 180)->nullable();
            $table->text('proposed_value');
            $table->text('source_details')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 24)->default('pending')->index();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_requests');
    }
};
