<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Role;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerIsolationTest extends TestCase
{
    use RefreshDatabase;

    private function shopWithUser(string $roleName = 'Admin'): array
    {
        $shop = Shop::factory()->create();
        \App\Support\DefaultRoles::createForShop($shop->id);
        $role = Role::where('shop_id', $shop->id)->where('name', $roleName)->firstOrFail();
        $user = User::factory()->create([
            'shop_id' => $shop->id,
            'role_id' => $role->id,
            'is_active' => true,
        ]);
        return [$shop, $user];
    }

    public function test_shop_b_cannot_read_shop_a_customer(): void
    {
        [, $userA] = $this->shopWithUser();
        [, $userB] = $this->shopWithUser();

        $c = Customer::withoutGlobalScope('shop')->create([
            'shop_id' => $userA->shop_id,
            'name' => 'A customer',
            'mobile' => '9000000001',
        ]);

        $this->actingAs($userB, 'sanctum')
            ->getJson("/api/v1/customers/{$c->id}")
            ->assertNotFound();
    }

    public function test_technician_only_sees_id_and_name(): void
    {
        [, $tech] = $this->shopWithUser('Technician');

        Customer::withoutGlobalScope('shop')->create([
            'shop_id' => $tech->shop_id,
            'name' => 'X',
            'mobile' => '9000000002',
        ]);

        $res = $this->actingAs($tech, 'sanctum')
            ->getJson('/api/v1/customers')
            ->assertOk();

        $row = $res->json('data.0');
        $this->assertSame(['id', 'name'], array_keys($row));
    }
}
