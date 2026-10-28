<?php

namespace Database\Factories;

use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Shop>
 */
class ShopFactory extends Factory
{
    protected $model = Shop::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->company().' Mobiles',
            'owner_name' => $this->faker->name(),
            'mobile' => $this->faker->unique()->numerify('9#########'),
            'email' => $this->faker->unique()->safeEmail(),
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
        ];
    }
}
