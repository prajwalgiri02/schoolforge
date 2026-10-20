<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed a local Studio: a demo login and the example school.
     */
    public function run(): void
    {
        User::query()->firstOrCreate(
            ['email' => 'admin@schoolforge.test'],
            ['name' => 'Studio Admin', 'password' => 'password'],
        );

        if (Project::query()->doesntExist()) {
            Project::factory()->example()->create();
        }
    }
}
