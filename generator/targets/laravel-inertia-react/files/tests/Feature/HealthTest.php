<?php

namespace Tests\Feature;

use App\Support\SchoolSite;
use App\Support\SiteHealth;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_reports_each_check(): void
    {
        Storage::fake('public');
        config(['mail.default' => 'log']);

        $response = $this->getJson('/health')->assertOk()->assertJsonPath('status', 'warning');

        $checks = collect($response->json('checks'))->keyBy('name');
        $this->assertSame('ok', $checks['database']['status']);
        $this->assertSame('ok', $checks['storage']['status']);
        $this->assertSame('ok', $checks['site_data']['status']);
        $this->assertSame('warning', $checks['scheduler']['status']);
        $this->assertSame('warning', $checks['mail']['status']);
        $this->assertStringNotContainsString(base_path(), $response->getContent(), 'no server paths are exposed');
    }

    public function test_the_scheduler_heartbeat_counts(): void
    {
        Cache::forever(SiteHealth::HEARTBEAT_KEY, now()->timestamp);

        $this->assertSame('ok', collect(SiteHealth::run()['checks'])->firstWhere('name', 'scheduler')['status']);
    }

    public function test_failures_return_503_and_a_failing_command(): void
    {
        config(['school.site_data' => '/nonexistent/site.json']);
        $this->app->forgetInstance(SchoolSite::class);
        $this->app->singleton(SchoolSite::class, fn () => new SchoolSite('/nonexistent/site.json'));

        $this->assertSame('failing', SiteHealth::run()['status']);
        $this->artisan('school:health')->assertFailed();
    }
}
