<?php

namespace Database\Factories;

use App\Models\FormSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<FormSubmission>
 */
class FormSubmissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->name();

        return [
            'type' => 'admission',
            'reference' => 'ADM-26-'.Str::upper(Str::random(6)),
            'status' => 'received',
            'name' => $name,
            'email' => fake()->safeEmail(),
            'data' => ['studentName' => fake()->firstName(), 'grade' => 'Grade 4', 'name' => $name, 'phone' => fake()->phoneNumber()],
            'files' => [],
        ];
    }

    /**
     * A testimonial waiting for approval.
     */
    public function testimonial(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => 'testimonial',
            'reference' => 'TES-26-'.Str::upper(Str::random(6)),
            'status' => 'pending',
            'data' => ['name' => $attributes['name'], 'role' => 'Parent', 'quote' => fake()->sentence(12)],
        ]);
    }
}
