<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('workbook_reviews', function (Blueprint $t) {
            $t->id(); $t->string('position_key')->unique(); $t->json('payload'); $t->timestamps();
        });
        Schema::create('workbook_review_history', function (Blueprint $t) {
            $t->id(); $t->string('position_key')->index(); $t->json('previous_payload')->nullable();
            $t->json('new_payload'); $t->string('file_hash',64); $t->timestamp('created_at');
        });
    }
    public function down(): void {
        Schema::dropIfExists('workbook_review_history'); Schema::dropIfExists('workbook_reviews');
    }
};
