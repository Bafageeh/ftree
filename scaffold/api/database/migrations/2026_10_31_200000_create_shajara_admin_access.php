<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('shajara_admin_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('username', 80)->unique();
            $table->string('password_hash', 255);
            $table->timestamps();
        });

        Schema::create('shajara_admin_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('shajara_admin_accounts')->cascadeOnDelete();
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shajara_admin_tokens');
        Schema::dropIfExists('shajara_admin_accounts');
    }
};
