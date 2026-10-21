<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SiteCheck;
use App\Models\User;
use App\Notifications\SiteStatusChanged;
use App\Support\SiteMonitor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SiteStatusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        Notification::fake();
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function liveProject(string $siteUrl = 'https://school.example.com/', array $config = []): Project
    {
        $project = Project::factory()->create();
        $project->update(['config' => [...$project->config, ...$config, 'seo' => ['siteUrl' => $siteUrl]]]);

        return $project;
    }

    public function test_the_health_url_depends_on_the_target(): void
    {
        $this->assertSame('https://school.example.com/api/health', SiteMonitor::healthUrl($this->liveProject()));
        $this->assertSame('https://school.example.com/health', SiteMonitor::healthUrl($this->liveProject(config: ['target' => 'laravel-inertia-react'])));
        $this->assertNull(SiteMonitor::healthUrl($this->liveProject('school.example.com')));
        $this->assertNull(SiteMonitor::healthUrl($this->liveProject('file:///etc/passwd')));
        $this->assertNull(SiteMonitor::healthUrl(Project::factory()->create()));
    }

    public function test_owners_are_emailed_when_a_site_goes_down_and_comes_back(): void
    {
        $owner = User::factory()->create();
        $editor = User::factory()->editor()->create();
        $project = $this->liveProject();

        Http::fakeSequence()
            ->push(['status' => 'ok', 'checks' => [['name' => 'site', 'status' => 'ok', 'message' => 'Fine.']]])
            ->push(['status' => 'warning', 'checks' => [['name' => 'mail', 'status' => 'warning', 'message' => 'Log mailer.']]])
            ->push(['status' => 'failing', 'checks' => [['name' => 'database', 'status' => 'failing', 'message' => 'Could not connect.']]], 503)
            ->pushFailedConnection()
            ->push(['status' => 'ok', 'checks' => []]);

        $this->assertSame('ok', SiteMonitor::check($project)->status);
        $this->assertSame('warning', SiteMonitor::check($project)->status);
        Notification::assertNothingSent();

        $failing = SiteMonitor::check($project);
        $this->assertSame('failing', $failing->status);
        $this->assertSame(503, $failing->http_status);
        Notification::assertSentTo($owner, SiteStatusChanged::class, fn (SiteStatusChanged $notification): bool => str_contains(implode(' ', $notification->toMail($owner)->introLines), 'Could not connect.'));
        Notification::assertNotSentTo($editor, SiteStatusChanged::class);

        $this->assertSame('down', SiteMonitor::check($project)->status);
        Notification::assertSentToTimes($owner, SiteStatusChanged::class, 1);

        $this->assertSame('ok', SiteMonitor::check($project)->status);
        Notification::assertSentToTimes($owner, SiteStatusChanged::class, 2);
        $this->assertSame(5, $project->siteChecks()->count());
    }

    public function test_answers_that_are_not_health_reports(): void
    {
        $project = $this->liveProject();

        Http::fakeSequence()->push('<html>Hello</html>')->push('Not found', 404)->push(['status' => 'ok', 'checks' => ['nonsense', ['name' => str_repeat('x', 100), 'status' => 'ok']]]);

        $html = SiteMonitor::check($project);
        $this->assertSame('warning', $html->status);
        $this->assertStringContainsString('Regenerate', $html->error);

        $missing = SiteMonitor::check($project);
        $this->assertSame('failing', $missing->status);
        $this->assertSame('The site answered with HTTP 404.', $missing->error);

        $checks = SiteMonitor::check($project)->checks;
        $this->assertCount(1, $checks, 'malformed rows are dropped');
        $this->assertSame(40, strlen($checks[0]['name']));
    }

    public function test_old_checks_are_pruned(): void
    {
        $project = $this->liveProject();
        SiteCheck::factory()->for($project)->count(SiteCheck::KEEP)->create(['created_at' => now()->subHour()]);
        Http::fake(['*' => Http::response(['status' => 'ok', 'checks' => []])]);

        SiteMonitor::check($project);

        $this->assertSame(SiteCheck::KEEP, $project->siteChecks()->count());
        $this->assertTrue($project->latestSiteCheck->created_at->isToday());
    }

    public function test_the_status_page_and_check_now(): void
    {
        $project = $this->liveProject();
        $unmonitored = Project::factory()->create();
        SiteCheck::factory()->for($project)->down()->create(['created_at' => now()->subMinutes(10)]);
        SiteCheck::factory()->for($project)->create(['created_at' => now()->subMinutes(5)]);
        Http::fake(['*' => Http::response(['status' => 'ok', 'checks' => []])]);

        $this->actingAs(User::factory()->viewer()->create())->get('/status')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Status/Index')
            ->where('sites', fn ($sites): bool => collect($sites)->firstWhere('slug', $project->slug)['uptime'] == 50
                && collect($sites)->firstWhere('slug', $project->slug)['latest']['status'] === 'ok'
                && collect($sites)->firstWhere('slug', $unmonitored->slug)['url'] === null));
        $this->post("/status/{$project->slug}")->assertForbidden();

        $this->actingAs(User::factory()->editor()->create())->post("/status/{$project->slug}")->assertSessionHas('success');
        $this->post("/status/{$unmonitored->slug}")->assertSessionHas('error');
        $this->assertSame(3, $project->siteChecks()->count());
    }

    public function test_the_command_checks_every_live_school(): void
    {
        $this->liveProject();
        $this->liveProject('https://other.example.com', ['target' => 'laravel-inertia-react']);
        Project::factory()->create();
        Http::fake(['https://school.example.com/*' => Http::response(['status' => 'ok']), 'https://other.example.com/*' => Http::failedConnection()]);

        $this->artisan('studio:check-sites')->assertSuccessful()->expectsOutputToContain('down');

        $this->assertSame(2, SiteCheck::query()->count());
        $this->assertSame('down', SiteCheck::query()->where('url', 'https://other.example.com/health')->sole()->status);
    }
}
