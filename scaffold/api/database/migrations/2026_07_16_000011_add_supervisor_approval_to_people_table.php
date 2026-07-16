<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('people', function (Blueprint $table) {
            $table->string('source_code', 120)->nullable()->unique()->after('full_name');
            $table->foreignId('chart_reading_id')->nullable()->unique()->after('source_code')
                ->constrained('chart_readings')->nullOnDelete();
            $table->string('approval_status', 32)->default('supervisor_confirmed')->after('status')->index();
            $table->boolean('is_provisional')->default(false)->after('approval_status')->index();
            $table->text('supervisor_note')->nullable()->after('is_provisional');
            $table->timestamp('approved_at')->nullable()->after('supervisor_note');
        });
    }

    public function down(): void
    {
        Schema::table('people', function (Blueprint $table) {
            $table->dropForeign(['chart_reading_id']);
            $table->dropUnique(['source_code']);
            $table->dropUnique(['chart_reading_id']);
            $table->dropIndex(['approval_status']);
            $table->dropIndex(['is_provisional']);
            $table->dropColumn([
                'source_code',
                'chart_reading_id',
                'approval_status',
                'is_provisional',
                'supervisor_note',
                'approved_at',
            ]);
        });
    }
};
