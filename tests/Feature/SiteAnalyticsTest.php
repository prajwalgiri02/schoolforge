<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use App\Support\SiteAnalytics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SiteAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['app.url' => 'http://studio.test']);
        $this->travelTo('2026-10-21 09:00:00');
    }

    private function hostedSchool(): Project
    {
        $project = Project::factory()->example()->create(['domain' => 'riverside.edu.np']);
        $this->actingAs(User::factory()->create())->post("http://studio.test/projects/{$project->slug}/publish");
        auth()->logout();

        return $project;
    }

    private function visit(string $url, string $agent = self::BROWSER, string $ip = '203.0.113.5'): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => $ip])->get($url, ['User-Agent' => $agent]);
    }

    public function test_visits_to_hosted_pages_are_counted_without_cookies(): void
    {
        $project = $this->hostedSchool();

        $this->visit('http://riverside.edu.np/');
        $this->visit('http://riverside.edu.np/about');
        $this->visit('http://riverside.edu.np/about');
        $this->visit('http://riverside.edu.np/about', ip: '198.51.100.9');
        $this->visit('http://riverside.edu.np/ne/about');
        $this->visit('http://riverside.edu.np/about', 'Googlebot/2.1 (+http://www.google.com/bot.html)');
        $this->visit('http://riverside.edu.np/no-such-page');
        $this->visit('http://riverside.edu.np/sitemap.xml');

        $summary = SiteAnalytics::summary($project);
        $this->assertSame(5, $summary['views']);
        $this->assertSame(2, $summary['visitors']);
        $this->assertSame(['path' => '/about', 'views' => 3], $summary['topPages'][0]);
        $this->assertCount(30, $summary['days']);
        $this->assertSame(['date' => '2026-10-21', 'views' => 5, 'visitors' => 2], $summary['days'][29]);

        $this->get('http://riverside.edu.np/about')->assertCookieMissing('laravel_session');
        $this->assertStringNotContainsString('203.0.113.5', (string) DB::table('site_visitors')->value('visitor'));
    }

    public function test_the_same_visitor_gets_a_new_hash_every_day(): void
    {
        $project = $this->hostedSchool();

        $this->visit('http://riverside.edu.np/');
        $this->travel(1)->days();
        $this->visit('http://riverside.edu.np/');

        $hashes = DB::table('site_visitors')->where('project_id', $project->id)->pluck('visitor');
        $this->assertCount(2, $hashes);
        $this->assertNotSame($hashes[0], $hashes[1]);
    }

    public function test_the_publish_tab_shows_visitors_after_loading(): void
    {
        $project = $this->hostedSchool();
        $this->visit('http://riverside.edu.np/');

        $this->actingAs(User::factory()->schoolStaff($project)->create())
            ->get("http://studio.test/projects/{$project->slug}/publish")
            ->assertInertia(fn (Assert $page) => $page
                ->missing('analytics')
                ->loadDeferredProps(fn (Assert $reload) => $reload->where('analytics.views', 1)->where('analytics.topPages.0.path', '/')));
    }

    public function test_old_counts_are_pruned(): void
    {
        $project = Project::factory()->create();
        DB::table('page_views')->insert([
            ['project_id' => $project->id, 'date' => '2025-01-01', 'path' => '/', 'views' => 4],
            ['project_id' => $project->id, 'date' => '2026-10-01', 'path' => '/', 'views' => 2],
        ]);
        DB::table('site_visitors')->insert(['project_id' => $project->id, 'date' => '2025-01-01', 'visitor' => str_repeat('a', 64)]);

        $this->assertSame(2, SiteAnalytics::prune());
        $this->assertSame(2, (int) DB::table('page_views')->sum('views'));
    }
}
