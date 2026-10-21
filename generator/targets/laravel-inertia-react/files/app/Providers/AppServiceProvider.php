<?php

namespace App\Providers;

use App\Models\User;
use App\Support\SchoolSite;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(SchoolSite::class, fn (): SchoolSite => new SchoolSite(config('school.site_data')));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('manage-school', fn (User $user): bool => $user->isAdmin());

        ResetPassword::createUrlUsing(fn (User $user, string $token): string => route('admin.password.reset', ['token' => $token, 'email' => $user->getEmailForPasswordReset()]));
    }
}
