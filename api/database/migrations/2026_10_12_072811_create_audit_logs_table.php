<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->string('module', 50);
    $table->unsignedBigInteger('record_id')->nullable();
    $table->string('action', 20);
    $table->json('old_json')->nullable();
    $table->json('new_json')->nullable();
    $table->string('ip_address', 45)->nullable();
    $table->timestamps();

    $table->index(['shop_id', 'module', 'record_id']);
    $table->index(['shop_id', 'created_at']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
