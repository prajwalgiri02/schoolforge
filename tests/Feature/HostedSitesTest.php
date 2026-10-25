<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SiteSubmission;
use App\Models\User;
use App\Support\HostedSites;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HostedSitesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['app.url' => 'http://studio.test', 'studio.hosting_domain' => null, 'mail.default' => 'array']);
    }

    private function publishedSchool(string $domain = 'riverside.edu.np'): Project
    {
        $project = Project::factory()->example()->create();
        $this->actingAs(User::factory()->create())->put("http://studio.test/projects/{$project->slug}/domain", ['domain' => $domain])->assertSessionHasNoErrors();
        $this->post("http://studio.test/projects/{$project->slug}/publish")->assertSessionHas('success');
        auth()->logout();

        return $project->fresh();
    }

    public function test_a_published_school_is_served_on_its_domain(): void
    {
        $project = $this->publishedSchool('www.Riverside.edu.np');
        $this->assertSame('riverside.edu.np', $project->domain);
        $this->assertSame('https://riverside.edu.np', $project->published_site['locales']['en']['site']['seo']['siteUrl']);

        $this->get('http://www.riverside.edu.np/about')
            ->assertOk()
            ->assertSee('<link rel="canonical" href="http://www.riverside.edu.np/about">', false)
            ->assertSee('<meta name="description" content="Our history, our people and the values that guide everything we do.">', false)
            ->assertSee('hreflang="ne"', false)
            ->assertInertia(fn (Assert $page) => $page->component('Preview')->where('hosted', true)->where('base', '')->where('slug', '/about')->where('site.school.name', $project->name));

        $this->get('http://riverside.edu.np/ne/about')->assertOk()->assertSee('<html lang="ne"', false)->assertInertia(fn (Assert $page) => $page->where('site.i18n.locale', 'ne'));
        $this->get('http://riverside.edu.np/news/new-robotics-and-innovation-lab-opens')->assertOk();
        $this->get('http://riverside.edu.np/no-such-page')->assertNotFound();
        $this->get('http://riverside.edu.np/login')->assertNotFound();
        $this->get('http://riverside.edu.np/projects')->assertNotFound();
        $this->assertGuest();

        $this->get('http://riverside.edu.np/sitemap.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml')
            ->assertSee('<loc>https://riverside.edu.np/about</loc>', false)
            ->assertSee('<loc>https://riverside.edu.np/ne/</loc>', false);
        $this->get('http://riverside.edu.np/robots.txt')->assertOk()->assertSee('Sitemap: http://riverside.edu.np/sitemap.xml');

        $this->get('http://studio.test/login')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Auth/Login'));
    }

    public function test_the_events_calendar_feed_is_served(): void
    {
        $this->publishedSchool();

        $this->get('http://riverside.edu.np/events.ics')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/calendar; charset=utf-8')
            ->assertSee('BEGIN:VCALENDAR', false)
            ->assertSee('SUMMARY:Annual Sports Week', false);
    }

    public function test_published_pages_are_rendered_to_html_for_search_engines(): void
    {
        $project = $this->publishedSchool();

        $this->assertSame(32, $project->publishedPages()->count(), '16 pages in each of two languages');

        $this->get('http://riverside.edu.np/')
            ->assertOk()
            ->assertSee('<div id="app"><', false)
            ->assertSee('Where curious minds grow', false)
            ->assertSee('<script data-page="app" type="application/json">', false);
        $this->get('http://riverside.edu.np/about')->assertSee('<h1', false);
        $this->get('http://riverside.edu.np/ne/about')->assertSee('<html lang="ne"', false)->assertSee('<div id="app"><', false);

        $this->get('http://riverside.edu.np/contact', ['X-Inertia' => 'true'])->assertOk()->assertJsonPath('component', 'Preview')->assertJsonPath('props.slug', '/contact');

        HostedSites::unpublish($project);
        $this->assertSame(0, $project->publishedPages()->count());
    }

    public function test_publishing_works_without_the_server_bundle(): void
    {
        config(['studio.ssr_bundle' => '/nonexistent/ssr.js']);
        $project = $this->publishedSchool();

        $this->assertNotNull($project->published_at);
        $this->assertSame(0, $project->publishedPages()->count());
        $this->get('http://riverside.edu.np/about')->assertOk()->assertSee('<div id="app"></div>', false);
    }

    public function test_changes_go_live_when_published_again_and_unpublishing_takes_the_site_offline(): void
    {
        $project = $this->publishedSchool();
        $this->actingAs(User::factory()->create());

        $project->update(['config' => [...$project->config, 'school' => [...$project->config['school'], 'tagline' => 'A brand new tagline']]]);
        $this->get("http://studio.test/projects/{$project->slug}/publish")->assertInertia(fn (Assert $page) => $page->where('hosting.changedSincePublished', true));
        $this->get('http://riverside.edu.np/')->assertDontSee('A brand new tagline');

        $this->post("http://studio.test/projects/{$project->slug}/publish");
        $this->get('http://riverside.edu.np/')->assertSee('A brand new tagline');

        $this->delete("http://studio.test/projects/{$project->slug}/publish")->assertSessionHas('success');
        $this->assertNull(HostedSites::forHost('riverside.edu.np'));
        $this->get('http://riverside.edu.np/about')->assertNotFound();
    }

    public function test_schools_get_a_subdomain_of_the_hosting_domain(): void
    {
        config(['studio.hosting_domain' => 'schools.example.com']);
        $project = Project::factory()->example()->create();
        $this->actingAs(User::factory()->editor()->create())->post("http://studio.test/projects/{$project->slug}/publish")->assertSessionHas('success');

        $this->get("http://{$project->slug}.schools.example.com/about")->assertOk();
        $this->assertSame("https://{$project->slug}.schools.example.com", HostedSites::url($project->fresh()));
    }

    public function test_unpublished_school_subdomains_are_not_found_rather_than_studio(): void
    {
        config(['studio.hosting_domain' => 'schools.example.com', 'app.url' => 'http://studio.schools.example.com']);
        $project = Project::factory()->example()->create();

        $this->get("http://{$project->slug}.schools.example.com/")->assertNotFound();
        $this->get('http://nobody.schools.example.com/login')->assertNotFound();
        $this->get('http://studio.schools.example.com/login')->assertOk();
    }

    public function test_a_school_needs_an_address_and_a_valid_config_to_publish(): void
    {
        $project = Project::factory()->create();
        $this->actingAs(User::factory()->create());

        $this->post("http://studio.test/projects/{$project->slug}/publish")->assertSessionHas('error', 'Set a domain for the school, or turn on the headless content API, first.');

        $project->update(['domain' => 'broken.edu.np', 'config' => [...$project->config, 'theme' => 'no-such-theme']]);
        $this->post("http://studio.test/projects/{$project->slug}/publish")->assertSessionHas('error');
        $this->assertNull($project->fresh()->published_at);
    }

    public function test_domains_are_validated_and_only_owners_set_them(): void
    {
        config(['studio.hosting_domain' => 'schools.example.com']);
        $project = Project::factory()->create();
        Project::factory()->create(['domain' => 'taken.edu.np']);

        $this->actingAs(User::factory()->editor()->create())->put("http://studio.test/projects/{$project->slug}/domain", ['domain' => 'mine.edu.np'])->assertForbidden();

        $this->actingAs(User::factory()->create());
        foreach (['not a domain', 'localhost', 'taken.edu.np', 'studio.test', 'other.schools.example.com', 'https://'] as $domain) {
            $this->put("http://studio.test/projects/{$project->slug}/domain", ['domain' => $domain])->assertSessionHasErrors('domain');
        }

        $this->put("http://studio.test/projects/{$project->slug}/domain", ['domain' => 'https://www.Mine.edu.np/home'])->assertSessionHasNoErrors();
        $this->assertSame('mine.edu.np', $project->fresh()->domain);
        $this->put("http://studio.test/projects/{$project->slug}/domain", ['domain' => ''])->assertSessionHasNoErrors();
        $this->assertNull($project->fresh()->domain);
    }

    public function test_the_studio_host_is_never_a_school(): void
    {
        Project::factory()->create(['domain' => 'studio.test', 'published_at' => now(), 'published_site' => ['languages' => ['en'], 'locales' => []]]);

        $this->assertNull(HostedSites::forHost('studio.test'));
        $this->get('http://studio.test/login')->assertOk();
    }

    public function test_visitors_send_enquiries_and_sign_up_for_alerts(): void
    {
        $project = $this->publishedSchool();
        $office = $project->config['school']['contact']['email'][0];

        $this->postJson('http://riverside.edu.np/_school/contact', ['name' => '', 'email' => 'nope'])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'message']);
        $this->postJson('http://riverside.edu.np/_school/contact', ['name' => 'Sita', 'email' => 'sita@example.com', 'subject' => 'Admissions', 'message' => 'When do classes start?'])->assertCreated();
        $this->postJson('http://riverside.edu.np/_school/subscribe', [])->assertUnprocessable();
        $this->postJson('http://riverside.edu.np/_school/subscribe', ['phone' => '9801234567'])->assertUnprocessable();
        $this->postJson('http://riverside.edu.np/_school/subscribe', ['email' => 'parent@example.com'])->assertCreated();
        $this->postJson('http://riverside.edu.np/_school/subscribe', ['email' => 'Parent@Example.com'])->assertCreated();

        $this->assertSame(['contact', 'subscribe'], $project->siteSubmissions()->orderBy('id')->pluck('form')->all());
        $messages = Mail::mailer('array')->getSymfonyTransport()->messages();
        $this->assertCount(1, $messages);
        $email = $messages[0]->getOriginalMessage();
        $this->assertSame($office, $email->getTo()[0]->getAddress());
        $this->assertSame('sita@example.com', $email->getReplyTo()[0]->getAddress());
        $this->assertStringContainsString('When do classes start?', $email->getTextBody());

        for ($attempt = 0; $attempt < 8; $attempt++) {
            $this->postJson('http://riverside.edu.np/_school/subscribe', ['email' => "parent{$attempt}@example.com"]);
        }
        $this->postJson('http://riverside.edu.np/_school/subscribe', ['email' => 'late@example.com'])->assertTooManyRequests();
    }

    public function test_applications_arrive_in_studio_with_their_files(): void
    {
        Storage::fake('local');
        $project = $this->publishedSchool();

        $this->post('http://riverside.edu.np/_school/forms/nonsense', [], ['Accept' => 'application/json'])->assertNotFound();
        $this->post('http://riverside.edu.np/_school/forms/job', [], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('name');

        $response = $this->post('http://riverside.edu.np/_school/forms/job', [
            'name' => 'Hari Sharma',
            'email' => 'hari@example.com',
            'phone' => '9800000000',
            'position' => 'Science Teacher',
            'cv' => UploadedFile::fake()->create('my-cv.pdf', 200, 'application/pdf'),
            'consent' => '1',
        ], ['Accept' => 'application/json'])->assertCreated();

        $submission = SiteSubmission::query()->where('reference', $response->json('reference'))->sole();
        $this->assertStringStartsWith('JOB-', $submission->reference);
        $this->assertSame('Hari Sharma', $submission->data['name']);
        Storage::disk('local')->assertExists($submission->files['cv']['path']);

        $this->actingAs(User::factory()->viewer()->create());
        $this->get("http://studio.test/projects/{$project->slug}/publish")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Projects/Publish')
            ->where('unread', 1)
            ->where('submissions.data.0.reference', $submission->reference)
            ->where('submissions.data.0.files', ['cv']));
        $this->get("http://studio.test/projects/{$project->slug}/submissions/{$submission->id}/files/cv")->assertOk()->assertDownload('my-cv.pdf');
        $this->delete("http://studio.test/projects/{$project->slug}/submissions/{$submission->id}")->assertForbidden();

        $this->patch("http://studio.test/projects/{$project->slug}/submissions/{$submission->id}");
        $this->assertNotNull($submission->fresh()->read_at);

        $this->actingAs(User::factory()->editor()->create())->delete("http://studio.test/projects/{$project->slug}/submissions/{$submission->id}")->assertSessionHas('success');
        $this->assertModelMissing($submission);
        Storage::disk('local')->assertMissing($submission->files['cv']['path']);
    }

    public function test_submissions_are_scoped_to_their_school(): void
    {
        $project = Project::factory()->create();
        $other = Project::factory()->create();
        $submission = $other->siteSubmissions()->create(['form' => 'contact', 'reference' => 'MSG-26-AAAAAA', 'data' => ['name' => 'X']]);

        $this->actingAs(User::factory()->create());
        $this->patch("http://studio.test/projects/{$project->slug}/submissions/{$submission->id}")->assertNotFound();
        $this->delete("http://studio.test/projects/{$project->slug}/submissions/{$submission->id}")->assertNotFound();
    }
}
