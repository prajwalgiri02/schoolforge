<?php

namespace Database\Factories;

use App\Models\GenerationRun;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GenerationRun>
 */
class GenerationRunFactory extends Factory
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
            'target' => 'nextjs',
            'output_path' => storage_path('framework/testing/generated/'.fake()->uuid()),
            'install' => false,
            'status' => GenerationRun::STATUS_QUEUED,
        ];
    }

    public function succeeded(): static
    {
        return $this->state(fn (): array => [
            'status' => GenerationRun::STATUS_SUCCEEDED,
            'log' => "Done!\n",
            'started_at' => now()->subMinute(),
            'finished_at' => now(),
        ]);
    }
}
