<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Support\DefaultRoles;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
{
    $shop = DB::table('shops')->where('email', 'demo@mobix.test')->first();

    if ($shop) {
        $this->command->info('Demo shop already exists, skipping.');
        return;
    }

    $shopId = DB::table('shops')->insertGetId([
        'name'       => 'Demo Mobile Shop',
        'owner_name' => 'Demo Owner',
        'mobile'     => '9999999999',
        'email'      => 'demo@mobix.test',
        'city'       => 'Madurai',
        'state'      => 'Tamil Nadu',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DefaultRoles::createForShop($shopId);
}
}
