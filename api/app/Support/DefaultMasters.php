<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class DefaultMasters
{
    // Sir confirm panna categories
    public const DEVICE_TYPES = [
        ['name' => 'Mobile Phone',            'requires_imei' => true],
        ['name' => 'Tablet',                  'requires_imei' => true],
        ['name' => 'Laptop',                  'requires_imei' => false],
        ['name' => 'Desktop Computer',        'requires_imei' => false],
        ['name' => 'TV',                      'requires_imei' => false],
        ['name' => 'Smartwatch',              'requires_imei' => false],
        ['name' => 'Other Electronic Device', 'requires_imei' => false],
    ];

    public const BRANDS = [
        'Apple', 'Samsung', 'Xiaomi', 'Realme', 'OnePlus', 'Oppo', 'Vivo', 'Motorola',
        'Nokia', 'Lenovo', 'HP', 'Dell', 'Asus', 'Acer', 'Sony', 'LG',
    ];

    // insertOrIgnore: rendu thadavai run panna duplicate aagaadhu
    public static function createForShop(int $shopId): void
    {
        $now = now();

        foreach (self::DEVICE_TYPES as $i => $type) {
            DB::table('device_types')->insertOrIgnore([
                'shop_id'       => $shopId,
                'name'          => $type['name'],
                'requires_imei' => $type['requires_imei'],
                'sort_order'    => $i + 1,
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);
        }

        foreach (self::BRANDS as $name) {
            DB::table('brands')->insertOrIgnore([
                'shop_id'    => $shopId,
                'name'       => $name,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
