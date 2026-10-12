<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class DefaultRoles
{
    public const MODULES = [
        'dashboard', 'jobs', 'customers', 'sales', 'inventory',
        'billing', 'expenses', 'reports', 'settings',
    ];

    private const ALL = ['view', 'create', 'edit', 'delete', 'export'];

    public static function matrix(): array
    {
        return [
            'Admin' => array_fill_keys(self::MODULES, self::ALL),

            'Front desk' => [
                'dashboard' => ['view'],
                'jobs'      => ['view', 'create', 'edit'],
                'customers' => ['view', 'create', 'edit'],
                'sales'     => ['view', 'create'],
                'inventory' => ['view'],
                'billing'   => ['view', 'create'],
                'expenses'  => ['view', 'create'],
                'reports'   => ['view'],
            ],

            'Technician' => [
                'dashboard' => ['view'],
                'jobs'      => ['view', 'edit'],
                'customers' => ['view'],
                'inventory' => ['view'],
                'reports'   => ['view'],
            ],

            'Store keeper' => [
                'dashboard' => ['view'],
                'jobs'      => ['view'],
                'inventory' => self::ALL,
                'expenses'  => ['view', 'create'],
                'reports'   => ['view', 'export'],
            ],
        ];
    }

    public static function createForShop(int $shopId): void
    {
        $now = now();

        foreach (self::matrix() as $roleName => $modules) {
            $roleId = DB::table('roles')->insertGetId([
                'shop_id'    => $shopId,
                'name'       => $roleName,
                'is_system'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach (self::MODULES as $module) {
                $perms = $modules[$module] ?? [];

                DB::table('role_permissions')->insert([
                    'shop_id'    => $shopId,
                    'role_id'    => $roleId,
                    'module'     => $module,
                    'can_view'   => in_array('view', $perms),
                    'can_create' => in_array('create', $perms),
                    'can_edit'   => in_array('edit', $perms),
                    'can_delete' => in_array('delete', $perms),
                    'can_export' => in_array('export', $perms),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
