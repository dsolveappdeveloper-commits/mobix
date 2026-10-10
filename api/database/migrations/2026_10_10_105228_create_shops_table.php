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
    Schema::create('shops', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('owner_name');
    $table->string('mobile', 15);
    $table->string('email');
    $table->string('city')->nullable();
    $table->string('state')->nullable();
    $table->string('gstin', 15)->nullable();
    $table->timestamps();
    $table->softDeletes();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shops');
    }
};
