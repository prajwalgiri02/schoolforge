<?php

namespace App\Console\Commands;

use App\Enums\StudioRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

class CreateStudioUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'studio:user
                            {email? : Email address used to sign in}
                            {--name= : Display name}
                            {--password= : Password (prompted when omitted)}
                            {--role=owner : owner, editor or viewer}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a SchoolForge Studio login, or reset the password of an existing one';

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
            'role' => ['required', new Enum(StudioRole::class)],
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
        $user->role = StudioRole::from($role);
        $user->save();

        $this->components->info($existed ? "Password updated for {$email}." : "Studio account created for {$email}. Sign in at ".url('/login'));

        return self::SUCCESS;
    }
}
