<?php

namespace App\Providers;

use App\Models\Project;
use App\Models\User;
use App\Services\Generator;
use App\Support\FormSchema;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(Generator::class, fn (): Generator => new Generator(
            config('studio.generator_path'),
            config('studio.node_binary'),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('signup', fn (Request $request): Limit => Limit::perHour(5)->by($request->ip()));

        Gate::define('edit-projects', fn (User $user): bool => $user->role->canEditProjects());
        Gate::define('set-domain', fn (User $user, Project $project): bool => $user->role->canManageStudio() || ($user->isSchoolStaff() && $user->canAccessProject($project)));
        Gate::define('manage-studio', fn (User $user): bool => $user->role->canManageStudio());

        FormSchema::$path = config('studio.generator_path').'/registry/runtime/forms.json';
    }
}
