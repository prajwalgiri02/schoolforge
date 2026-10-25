<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\FormSubmission;
use App\Models\SiteContent;
use App\Models\User;
use App\Support\Color;
use App\Support\SchoolSite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WebsiteSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false, 'mail.default' => 'array']);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function editablePages(User $user): array
    {
        $pages = [];
        $this->actingAs($user)->get('/admin/website')->assertInertia(function (Assert $page) use (&$pages): void {
            $page->component('Admin/Website');
            $pages = $page->toArray()['props']['pages'];
        });

        return $pages;
    }

    public function test_pages_can_be_renamed_hidden_and_reordered(): void
    {
        $admin = User::factory()->create();
        $pages = $this->editablePages($admin);
        $about = collect($pages)->search(fn (array $page): bool => $page['slug'] === '/about');
        $contact = collect($pages)->search(fn (array $page): bool => $page['slug'] === '/contact');

        $pages[$about] = [...$pages[$about], 'title' => 'Our Story', 'navLabel' => 'Story'];
        $pages[$contact]['showInNav'] = false;
        $reordered = [$pages[$about], ...array_values(array_filter($pages, fn (array $page): bool => $page['slug'] !== '/about'))];

        $this->actingAs($admin)->put('/admin/website/pages', ['pages' => $reordered])->assertSessionHasNoErrors();

        $site = app(SchoolSite::class)->data();
        $this->assertSame('/about', $site['pages'][0]['slug']);
        $this->assertSame('Our Story', $site['pages'][0]['title']);
        $this->assertSame(['label' => 'Story', 'href' => '/about'], $site['navigation'][0]);
        $this->assertNotContains('/contact', array_column($site['navigation'], 'href'));
        $this->assertTrue(collect($site['pages'])->contains('slug', '/contact'), 'hidden pages still exist');

        $this->actingAs($admin)->delete('/admin/website/pages');
        $this->assertSame('/', app(SchoolSite::class)->data()['pages'][0]['slug']);
    }

    public function test_brand_colours_are_applied_with_readable_text(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->put('/admin/website/design', ['colors' => ['primary' => 'red']])->assertSessionHasErrors('colors.primary');
        $this->actingAs($admin)->put('/admin/website/design', ['colors' => ['primary' => '#FDE047', 'accent' => '#22C55E']])->assertSessionHasNoErrors();

        $css = app(SchoolSite::class)->colorOverridesCss();
        $this->assertStringContainsString('--color-primary:#fde047', $css);
        $this->assertStringContainsString('--color-primary-foreground:#111827', $css, 'dark text on a light colour');
        $this->assertGreaterThanOrEqual(4.5, Color::contrast(str($css)->match('/--color-accent-strong:(#[0-9a-f]{6})/')->value(), '#ffffff'));

        $this->get('/')->assertSee('--color-primary:#fde047', false);

        $this->actingAs($admin)->put('/admin/website/design', ['colors' => []]);
        $this->assertSame('', app(SchoolSite::class)->colorOverridesCss());
    }

    public function test_settings_are_exported_to_the_config(): void
    {
        $path = storage_path('framework/testing/website.config.json');
        File::ensureDirectoryExists(dirname($path));
        File::put($path, json_encode(['school' => ['name' => 'School'], 'pages' => [['slug' => '/', 'title' => 'Home', 'sections' => []], ['slug' => '/about', 'title' => 'About', 'sections' => []]]]));
        SiteContent::factory()->create(['key' => SchoolSite::DESIGN, 'value' => ['colors' => ['primary' => '#123456']]]);
        SiteContent::factory()->create(['key' => SchoolSite::PAGE_SETTINGS, 'value' => ['/about' => ['title' => 'Our Story', 'showInNav' => false, 'order' => 0], '/' => ['order' => 1]]]);

        $this->artisan('school:export-content', ['--path' => $path])->assertSuccessful();
        $config = json_decode(File::get($path), true);
        File::delete($path);

        $this->assertSame('#123456', $config['colors']['primary']);
        $this->assertSame(['/about', '/'], array_column($config['pages'], 'slug'));
        $this->assertSame('Our Story', $config['pages'][0]['title']);
        $this->assertFalse($config['pages'][0]['showInNav']);
    }

    public function test_enquiries_can_be_answered_and_exported(): void
    {
        config(['school.contact_recipient' => 'office@example.com']);
        $admin = User::factory()->create();
        $message = ContactMessage::factory()->create(['name' => 'Sita', 'email' => 'sita@example.com', 'message' => 'Is there a bus?']);

        $this->actingAs($admin)->post("/admin/messages/{$message->id}/reply", ['reply' => ''])->assertSessionHasErrors('reply');
        $this->actingAs($admin)->post("/admin/messages/{$message->id}/reply", ['reply' => 'Yes, route 7 stops near you.'])->assertSessionHas('success');

        $sent = Mail::mailer('array')->getSymfonyTransport()->messages()[0]->getOriginalMessage();
        $this->assertSame('sita@example.com', $sent->getTo()[0]->getAddress());
        $this->assertSame('office@example.com', $sent->getReplyTo()[0]->getAddress());
        $this->assertStringContainsString('> Is there a bus?', $sent->getTextBody());

        $message->refresh();
        $this->assertSame('Yes, route 7 stops near you.', $message->reply);
        $this->assertSame($admin->id, $message->replied_by);
        $this->assertNotNull($message->read_at);

        $csv = $this->actingAs($admin)->get('/admin/messages/export.csv')->assertOk()->streamedContent();
        $this->assertStringContainsString('sita@example.com', $csv);
    }

    public function test_the_dashboard_shows_what_needs_attention(): void
    {
        ContactMessage::factory()->count(2)->create();
        FormSubmission::factory()->create();

        $this->actingAs(User::factory()->create())->get('/admin')->assertInertia(fn (Assert $page) => $page
            ->where('stats.0', ['key' => 'messages', 'label' => 'New enquiries', 'value' => 2])
            ->where('stats.1.value', 1)
            ->has('stats', 4));

        $this->actingAs(User::factory()->create(['role' => 'editor']))->get('/admin')->assertInertia(fn (Assert $page) => $page->has('stats', 3));
    }
}
