<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->text('address')->nullable()->after('state');
            $table->string('phone', 15)->nullable()->after('address');
            $table->string('website')->nullable()->after('phone');
            $table->string('review_link', 500)->nullable()->after('website');
        });
    }

    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn(['address', 'phone', 'website', 'review_link']);
        });
    }
};
