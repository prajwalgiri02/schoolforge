<?php

namespace App\Providers;

use App\Support\SchoolSite;
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
        //
    }
}
