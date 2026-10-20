<?php

namespace Database\Factories;

use App\Models\Card;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Card>
 */
class CardFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->company(),
            'kind' => fake()->randomElement(['Potraviny', 'Kaviareň', 'Lekáreň', 'Fitness']),
            'number' => fake()->numerify('############'),
            'format' => 'CODE128',
            'color' => fake()->randomElement(['#1F4D3A', '#2F5DA8', '#E4572E', '#17171A']),
            'holder' => fake()->name(),
            'note' => null,
        ];
    }
}
