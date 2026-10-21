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
        Schema::create('customers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
    $table->string('name', 150);
    $table->string('mobile', 10);
    $table->string('alt_mobile', 10)->nullable();
    $table->string('email', 150)->nullable();
    $table->string('address', 255)->nullable();
    $table->string('city', 100)->nullable();
    $table->string('pincode', 10)->nullable();
    $table->string('type', 20)->default('retail');
    $table->string('gstin', 15)->nullable();
    $table->date('dob')->nullable();
    $table->text('notes')->nullable();
    $table->boolean('marketing_consent')->default(false);
    $table->decimal('credit_limit', 12, 2)->default(0);
    $table->boolean('is_active')->default(true);
    $table->unsignedBigInteger('created_by')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->unique(['shop_id', 'mobile']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
