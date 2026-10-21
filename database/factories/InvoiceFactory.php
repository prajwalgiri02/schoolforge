<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
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
            'number' => 'INV-'.fake()->unique()->numerify('####-####'),
            'description' => 'Standard hosting',
            'amount' => 1500,
            'period_start' => today(),
            'period_end' => today()->addMonthNoOverflow()->subDay(),
            'due_on' => today(),
            'status' => Invoice::STATUS_UNPAID,
        ];
    }
}
