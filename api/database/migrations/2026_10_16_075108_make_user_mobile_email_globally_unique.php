<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. shop_id FK ku thani index (composite uniques drop panna FK ku index venum)
        if (! Schema::hasIndex('users', 'users_shop_id_index')) {
            Schema::table('users', fn (Blueprint $table) => $table->index('shop_id'));
        }

        // 2. pazhaya per-shop uniques remove (already remove aagirundha skip)
        foreach (['users_shop_id_mobile_unique', 'users_shop_id_email_unique'] as $name) {
            if (Schema::hasIndex('users', $name)) {
                Schema::table('users', fn (Blueprint $table) => $table->dropIndex($name));
            }
        }

        // 3. global uniques
        if (! Schema::hasIndex('users', 'users_mobile_unique')) {
            Schema::table('users', fn (Blueprint $table) => $table->unique('mobile'));
        }
        if (! Schema::hasIndex('users', 'users_email_unique')) {
            Schema::table('users', fn (Blueprint $table) => $table->unique('email'));
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['mobile']);
            $table->dropUnique(['email']);
            $table->unique(['shop_id', 'mobile']);
            $table->unique(['shop_id', 'email']);
        });
    }
};
