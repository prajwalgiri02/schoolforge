<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\SiteCheck;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SiteCheck>
 */
class SiteCheckFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'url' => 'https://school.example.com/health',
            'status' => SiteCheck::STATUS_OK,
            'http_status' => 200,
            'response_ms' => fake()->numberBetween(50, 900),
            'checks' => [['name' => 'database', 'status' => 'ok', 'message' => 'Connected.']],
            'created_at' => now(),
        ];
    }

    public function down(): static
    {
        return $this->state(fn (): array => ['status' => SiteCheck::STATUS_DOWN, 'http_status' => null, 'checks' => null, 'error' => 'Connection refused']);
    }
}
