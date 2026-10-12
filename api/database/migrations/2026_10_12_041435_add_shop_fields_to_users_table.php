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
    Schema::table('users', function (Blueprint $table) {
        $table->foreignId('shop_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        $table->foreignId('role_id')->nullable()->after('shop_id')->constrained();
        $table->string('mobile', 15)->after('name');
        $table->decimal('commission_pct', 5, 2)->default(0);
        $table->boolean('is_active')->default(true);
        $table->softDeletes();
    });

    Schema::table('users', function (Blueprint $table) {
        $table->dropUnique('users_email_unique');
        $table->string('email')->nullable()->change();
        $table->unique(['shop_id', 'mobile']);
        $table->unique(['shop_id', 'email']);
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropUnique(['shop_id', 'mobile']);
        $table->dropUnique(['shop_id', 'email']);
        $table->dropConstrainedForeignId('role_id');
        $table->dropConstrainedForeignId('shop_id');
        $table->dropColumn(['mobile', 'commission_pct', 'is_active', 'deleted_at']);
    });
}
};
