<?php

namespace App\Console\Commands;

use App\Enums\StaffRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

class CreateSchoolAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'school:admin
                            {email? : Email address used to sign in}
                            {--name= : Display name}
                            {--password= : Password (prompted when omitted)}
                            {--role=admin : admin or editor}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an admin panel account, or reset the password of an existing one';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email') ?? text('Email address', required: true);
        $password = $this->option('password') ?? password('Password (min. 8 characters)', required: true);

        $role = $this->option('role');

        $validator = Validator::make(compact('email', 'password', 'role'), [
            'email' => ['required', 'email', 'max:190'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', new Enum(StaffRole::class)],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->components->error($error);
            }

            return self::FAILURE;
        }

        $user = User::query()->firstOrNew(['email' => $email]);
        $existed = $user->exists;
        $user->name = $this->option('name') ?? $user->name ?? 'Administrator';
        $user->password = $password;
        $user->role = StaffRole::from($role);
        $user->save();

        $this->components->info($existed ? "Password updated for {$email}." : "Admin account created for {$email}. Sign in at ".url('/admin'));

        return self::SUCCESS;
    }
}
