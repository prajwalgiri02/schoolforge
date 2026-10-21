<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Standard',
            'price' => 1500,
            'period' => 'month',
            'description' => 'Hosting, domain support and updates.',
        ];
    }

    public function yearly(): static
    {
        return $this->state(fn (): array => ['name' => 'Annual', 'price' => 15000, 'period' => 'year']);
    }
}
