<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('people', function (Blueprint $table): void {
            $table->string('gender', 20)->nullable()->after('honorific');
            $table->text('general_details')->nullable()->after('summary');
            $table->string('profile_photo_path')->nullable()->after('general_details');
        });
    }

    public function down(): void
    {
        Schema::table('people', function (Blueprint $table): void {
            $table->dropColumn(['gender', 'general_details', 'profile_photo_path']);
        });
    }
};
