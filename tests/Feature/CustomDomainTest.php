<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use App\Support\DomainCheck;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomDomainTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['app.url' => 'http://studio.test', 'studio.server_ips' => '203.0.113.10', 'studio.hosting_domain' => 'schools.example.com']);
        DomainCheck::$resolver = fn (string $host): array => match ($host) {
            'riverside.edu.np' => ['203.0.113.10'],
            'www.riverside.edu.np' => ['198.51.100.7'],
            default => [],
        };
    }

    protected function tearDown(): void
    {
        DomainCheck::$resolver = null;

        parent::tearDown();
    }

    private function publishedSchool(): Project
    {
        return Project::factory()->create(['domain' => 'riverside.edu.np', 'published_at' => now(), 'published_site' => ['languages' => ['en'], 'locales' => [], 'configHash' => '']]);
    }

    public function test_certificates_are_allowed_only_for_published_schools(): void
    {
        $school = $this->publishedSchool();
        Project::factory()->create(['domain' => 'draft.edu.np']);

        $this->get('http://studio.test/hosting/certificate-check?domain=riverside.edu.np')->assertOk();
        $this->get('http://studio.test/hosting/certificate-check?domain=www.riverside.edu.np')->assertOk();
        $this->get("http://studio.test/hosting/certificate-check?domain={$school->slug}.schools.example.com")->assertOk();
        $this->get('http://studio.test/hosting/certificate-check?domain=draft.edu.np')->assertNotFound();
        $this->get('http://studio.test/hosting/certificate-check?domain=evil.example.org')->assertNotFound();
        $this->get('http://studio.test/hosting/certificate-check?domain=studio.test')->assertNotFound();
        $this->get('http://studio.test/hosting/certificate-check')->assertNotFound();
    }

    public function test_the_domain_check_reports_dns_and_https(): void
    {
        $school = $this->publishedSchool();
        Http::fake(['https://riverside.edu.np/robots.txt' => Http::response("User-agent: *\nSitemap: https://riverside.edu.np/sitemap.xml\n")]);

        $result = DomainCheck::run($school);

        $this->assertSame([
            ['host' => 'riverside.edu.np', 'addresses' => ['203.0.113.10'], 'pointsHere' => true],
            ['host' => 'www.riverside.edu.np', 'addresses' => ['198.51.100.7'], 'pointsHere' => false],
        ], $result['records']);
        $this->assertTrue($result['https']);
    }

    public function test_https_fails_when_the_site_cannot_be_reached(): void
    {
        $school = $this->publishedSchool();
        Http::fake(fn () => throw new ConnectionException('SSL certificate problem'));

        $this->assertFalse(DomainCheck::https($school));
    }

    public function test_the_publish_tab_runs_the_check_only_when_asked(): void
    {
        $school = $this->publishedSchool();
        Http::fake(['*' => Http::response('', 404)]);
        $this->actingAs(User::factory()->create());

        $this->get("http://studio.test/projects/{$school->slug}/publish")->assertInertia(fn (Assert $page) => $page->missing('domainCheck'));
        Http::assertNothingSent();

        $this->get("http://studio.test/projects/{$school->slug}/publish", [
            'X-Inertia' => 'true',
            'X-Inertia-Partial-Component' => 'Projects/Publish',
            'X-Inertia-Partial-Data' => 'domainCheck',
            'X-Inertia-Version' => (string) Inertia::getVersion(),
        ])->assertOk()->assertJsonPath('props.domainCheck.records.0.pointsHere', true)->assertJsonPath('props.domainCheck.https', false);
    }

    public function test_server_addresses_fall_back_to_studios_own_host(): void
    {
        config(['studio.server_ips' => null]);
        DomainCheck::$resolver = fn (string $host): array => $host === 'studio.test' ? ['192.0.2.1'] : [];

        $this->assertSame(['192.0.2.1'], DomainCheck::serverAddresses());
    }
}
