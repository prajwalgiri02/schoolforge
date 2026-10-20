<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->city().' Public School';

        return [
            'name' => $name,
            'config' => [
                'target' => 'nextjs',
                'theme' => 'classic',
                'school' => [
                    'name' => $name,
                    'tagline' => 'Learning for life',
                    'about' => ['summary' => fake()->sentence(14)],
                    'contact' => ['email' => [fake()->safeEmail()]],
                ],
                'stats' => [
                    ['label' => 'Students', 'value' => '850'],
                    ['label' => 'Teachers', 'value' => '60'],
                ],
                'faqs' => [
                    ['question' => 'When does school start?', 'answer' => 'At 8:30 AM.'],
                ],
            ],
        ];
    }

    /**
     * A project using the full example school from the generator.
     */
    public function example(): static
    {
        return $this->state(function (): array {
            $config = json_decode(file_get_contents(base_path('generator/examples/school.config.json')), true);
            unset($config['$schema']);

            return ['name' => $config['school']['name'], 'config' => $config];
        });
    }
}
