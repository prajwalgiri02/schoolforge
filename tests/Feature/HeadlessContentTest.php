<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use App\Support\HeadlessContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HeadlessContentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['app.url' => 'http://studio.test', 'studio.hosting_domain' => null]);
    }

    private function headlessSchool(?string $siteUrl = 'https://www.school.edu.np'): Project
    {
        $project = Project::factory()->example()->create();
        $seo = $project->config['seo'];
        unset($seo['siteUrl']);
        $project->update(['config' => [...$project->config, 'seo' => $siteUrl ? [...$seo, 'siteUrl' => $siteUrl] : $seo]]);
        HeadlessContent::enable($project);

        return $project->fresh();
    }

    public function test_publishing_serves_the_content_and_refreshes_the_site(): void
    {
        Http::fake(['https://www.school.edu.np/api/revalidate' => Http::response(['revalidated' => true])]);
        $project = $this->headlessSchool();
        $url = "http://studio.test/api/sites/{$project->slug}/content";

        $this->getJson($url, ['Authorization' => "Bearer {$project->content_token}"])->assertNotFound();

        $this->actingAs(User::factory()->editor()->create())->post("http://studio.test/projects/{$project->slug}/publish")
            ->assertSessionHas('success', "{$project->name} is published. The website refreshed its content.");
        Http::assertSent(fn (ClientRequest $request): bool => $request->url() === 'https://www.school.edu.np/api/revalidate' && $request->hasHeader('Authorization', "Bearer {$project->content_token}"));

        $this->getJson($url, ['Authorization' => "Bearer {$project->content_token}"])
            ->assertOk()
            ->assertJsonPath('defaultLocale', 'en')
            ->assertJsonPath('locales.en.school.name', $project->name)
            ->assertJsonPath('locales.ne.i18n.locale', 'ne')
            ->assertJsonPath('locales.en.seo.siteUrl', 'https://www.school.edu.np')
            ->assertJsonMissingPath('locales.en.tokens');
    }

    public function test_the_content_api_needs_the_token(): void
    {
        $project = $this->headlessSchool();
        $project->forceFill(['published_at' => now(), 'published_site' => ['languages' => ['en'], 'locales' => ['en' => ['site' => ['school' => ['name' => 'X']]]], 'configHash' => '']])->save();
        $url = "http://studio.test/api/sites/{$project->slug}/content";

        $this->getJson($url)->assertUnauthorized();
        $this->getJson($url, ['Authorization' => 'Bearer wrong'])->assertUnauthorized();
        $this->getJson($url, ['Authorization' => "Bearer {$project->content_token}"])->assertOk();

        $oldToken = $project->content_token;
        HeadlessContent::enable($project);
        $this->getJson($url, ['Authorization' => "Bearer {$oldToken}"])->assertUnauthorized();

        HeadlessContent::disable($project);
        $this->getJson($url, ['Authorization' => "Bearer {$oldToken}"])->assertUnauthorized();
        $this->assertArrayNotHasKey('content_token', $project->fresh()->toArray());
    }

    public function test_publishing_explains_when_the_site_cannot_be_refreshed(): void
    {
        Http::fake(['https://www.school.edu.np/*' => Http::response('Unauthorized', 401)]);
        $this->actingAs(User::factory()->create());

        $project = $this->headlessSchool();
        $this->post("http://studio.test/projects/{$project->slug}/publish")->assertSessionHas('success', fn (string $message): bool => str_contains($message, 'did not accept the refresh (HTTP 401)'));

        $unreachable = $this->headlessSchool(null);
        $this->post("http://studio.test/projects/{$unreachable->slug}/publish")->assertSessionHas('success', fn (string $message): bool => str_contains($message, 'Set the site URL'));
        Http::assertSentCount(1);
    }

    public function test_editors_manage_the_api_and_viewers_cannot_see_the_token(): void
    {
        $project = Project::factory()->create(['config' => [...Project::factory()->make()->config, 'target' => 'nextjs']]);

        $this->actingAs(User::factory()->viewer()->create())->post("http://studio.test/projects/{$project->slug}/headless")->assertForbidden();

        $this->actingAs(User::factory()->editor()->create())->post("http://studio.test/projects/{$project->slug}/headless")->assertSessionHas('success', 'Headless content API turned on.');
        $token = $project->fresh()->content_token;
        $this->assertStringStartsWith('sfc_', $token);
        $this->get("http://studio.test/projects/{$project->slug}/publish")->assertInertia(fn (Assert $page) => $page
            ->where('headless.enabled', true)
            ->where('headless.token', $token)
            ->where('headless.contentUrl', "http://studio.test/api/sites/{$project->slug}/content"));

        $this->actingAs(User::factory()->viewer()->create())->get("http://studio.test/projects/{$project->slug}/publish")->assertInertia(fn (Assert $page) => $page->where('headless.token', null));

        $this->actingAs(User::factory()->editor()->create())->delete("http://studio.test/projects/{$project->slug}/headless")->assertSessionHas('success');
        $this->assertNull($project->fresh()->content_token);
    }
}
