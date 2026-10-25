<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\SiteContent;
use App\Models\User;
use App\Support\ContentSchema;
use App\Support\SchoolSite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
    }

    private function admin(): User
    {
        return User::factory()->create(['email' => 'admin@example.com', 'password' => 'secret-password']);
    }

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->put('/admin/content/hero', ['value' => ['title' => 'Hacked']])->assertRedirect('/admin/login');
        $this->get('/admin/messages')->assertRedirect('/admin/login');

        $this->assertDatabaseCount(SiteContent::class, 0);
    }

    public function test_login_page_renders(): void
    {
        $this->get('/admin/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Login')->has('schoolName'));
    }

    public function test_admin_can_sign_in_and_out(): void
    {
        $this->admin();

        $this->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'secret-password'])
            ->assertRedirect('/admin');
        $this->assertAuthenticated();

        $this->post('/admin/logout')->assertRedirect('/admin/login');
        $this->assertGuest();
    }

    public function test_sign_in_fails_with_wrong_password(): void
    {
        $this->admin();

        $this->from('/admin/login')
            ->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'wrong-password'])
            ->assertRedirect('/admin/login')
            ->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_too_many_sign_in_attempts_show_a_message(): void
    {
        foreach (range(1, 5) as $attempt) {
            $this->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'wrong-password']);
        }

        $this->from('/admin/login')
            ->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'wrong-password'], ['X-Inertia' => 'true'])
            ->assertRedirect('/admin/login')
            ->assertSessionHasErrors(['email' => 'Too many attempts. Please wait 1 minute and try again.']);
    }

    public function test_numbers_in_text_fields_save_unchanged(): void
    {
        $this->actingAs(User::factory()->create());

        $this->put('/admin/content/school', ['value' => ['name' => 'Riverside', 'established' => 1998]])->assertSessionHasNoErrors();
        $this->put('/admin/content/achievements', ['value' => [['year' => 2026, 'title' => 'Olympiad gold']]])->assertSessionHasNoErrors();
    }

    public function test_dashboard_lists_every_content_section(): void
    {
        ContactMessage::factory()->count(2)->create();

        $this->actingAs($this->admin())
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->has('sections', count(ContentSchema::sections()))
                ->where('unreadMessages', 2)
                ->has('recentMessages', 2));
    }

    public function test_editor_shows_current_content(): void
    {
        $hero = app(SchoolSite::class)->fileData()['content']['hero'] ?? [];

        $this->actingAs($this->admin())
            ->get('/admin/content/hero')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Content/Edit')
                ->where('sectionKey', 'hero')
                ->where('section.kind', 'object')
                ->where('isEdited', false)
                ->where('value.title', $hero['title'] ?? null));
    }

    public function test_unknown_section_returns_not_found(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->get('/admin/content/unicorns')->assertNotFound();
        $this->actingAs($admin)->put('/admin/content/unicorns', ['value' => []])->assertNotFound();
        $this->actingAs($admin)->delete('/admin/content/unicorns')->assertNotFound();
    }

    public function test_saved_content_appears_on_the_website(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->from('/admin/content/hero')
            ->put('/admin/content/hero', ['value' => [
                'title' => 'A brand new headline',
                'subtitle' => '  ',
                'primaryCta' => ['label' => 'Apply', 'href' => '/admissions'],
                'secondaryCta' => ['label' => null, 'href' => null],
            ]])
            ->assertRedirect('/admin/content/hero')
            ->assertSessionHas('success');

        $this->assertSame(
            ['title' => 'A brand new headline', 'primaryCta' => ['label' => 'Apply', 'href' => '/admissions']],
            SiteContent::query()->where('key', 'hero')->sole()->value,
        );

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('site.content.hero.title', 'A brand new headline')
            ->missing('site.content.hero.subtitle'));
    }

    public function test_school_profile_edits_keep_nested_details(): void
    {
        $this->actingAs($this->admin())
            ->put('/admin/content/school', ['value' => ['name' => 'Renamed Academy', 'established' => '2001']])
            ->assertSessionHasNoErrors();

        $site = app(SchoolSite::class)->data();
        $original = app(SchoolSite::class)->fileData()['school'];

        $this->assertSame('Renamed Academy', $site['school']['name']);
        $this->assertSame(2001, $site['school']['established']);
        $this->assertSame($original['contact'] ?? null, $site['school']['contact'] ?? null);
    }

    public function test_list_sections_are_validated_per_item(): void
    {
        $this->actingAs($this->admin())
            ->from('/admin/content/events')
            ->put('/admin/content/events', ['value' => [
                ['title' => 'Sports day', 'date' => '2027-02-10'],
                ['title' => '', 'date' => '10/02/2027'],
            ]])
            ->assertRedirect('/admin/content/events')
            ->assertSessionHasErrors(['value.1.title', 'value.1.date']);

        $this->assertDatabaseCount(SiteContent::class, 0);
    }

    public function test_news_with_a_body_gets_an_article_page(): void
    {
        $this->actingAs($this->admin())->put('/admin/content/news', ['value' => [
            ['title' => 'Robotics Team Wins!', 'date' => '2027-03-01', 'body' => ['First paragraph.', 'Second paragraph.']],
            ['title' => 'Short notice without body'],
        ]])->assertSessionHasNoErrors();

        $this->assertSame('robotics-team-wins', SiteContent::query()->where('key', 'news')->sole()->value[0]['slug']);

        $this->get('/news/robotics-team-wins')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('slug', '/news/robotics-team-wins'));
        $this->get('/news/short-notice-without-body')->assertNotFound();
    }

    public function test_section_can_be_reset_to_original_content(): void
    {
        SiteContent::factory()->create(['key' => 'hero', 'value' => ['title' => 'Temporary']]);

        $this->actingAs($this->admin())
            ->delete('/admin/content/hero')
            ->assertSessionHas('success');

        $this->assertDatabaseCount(SiteContent::class, 0);
        $this->assertSame(
            app(SchoolSite::class)->fileData()['content']['hero'] ?? null,
            app(SchoolSite::class)->data()['content']['hero'] ?? null,
        );
    }

    public function test_images_can_be_uploaded(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin())
            ->post('/admin/uploads', ['file' => UploadedFile::fake()->image('campus.jpg', 1200, 800)])
            ->assertCreated()
            ->assertJsonStructure(['url']);

        $this->assertStringStartsWith('/storage/school/', $response->json('url'));
        $this->assertStringEndsWith('.r.webp', $response->json('url'));
        $this->assertCount(4, Storage::disk('public')->allFiles('school'), 'main image plus 480, 960 and 1440 pixel copies');

        $main = imagecreatefromstring(Storage::disk('public')->get(substr($response->json('url'), strlen('/storage/'))));
        $this->assertSame(1200, imagesx($main), 'images narrower than 1920px keep their size');
    }

    public function test_large_images_are_resized_and_gifs_kept(): void
    {
        Storage::fake('public');
        $admin = $this->admin();

        $url = $this->actingAs($admin)->post('/admin/uploads', ['file' => UploadedFile::fake()->image('wide.png', 4000, 2000)])->json('url');
        $this->assertSame(1920, imagesx(imagecreatefromstring(Storage::disk('public')->get(substr($url, strlen('/storage/'))))));
        $this->assertSame(480, imagesx(imagecreatefromstring(Storage::disk('public')->get(str_replace(['/storage/', '.r.webp'], ['', '.480.webp'], $url)))));

        $gif = $this->actingAs($admin)->post('/admin/uploads', ['file' => UploadedFile::fake()->image('animation.gif', 100, 100)])->json('url');
        $this->assertStringEndsWith('.gif', $gif);
    }

    public function test_uploads_must_be_images(): void
    {
        Storage::fake('public');

        $this->actingAs($this->admin())
            ->postJson('/admin/uploads', ['file' => UploadedFile::fake()->create('virus.php', 10, 'text/x-php')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');

        $this->assertCount(0, Storage::disk('public')->allFiles());
    }

    public function test_documents_can_be_uploaded_and_reused_from_the_library(): void
    {
        Storage::fake('public');
        $admin = $this->admin();

        $pdf = $this->actingAs($admin)->post('/admin/uploads', ['file' => UploadedFile::fake()->create('Fee Structure.pdf', 120, 'application/pdf')])->assertCreated()->json('url');
        $image = $this->actingAs($admin)->post('/admin/uploads', ['file' => UploadedFile::fake()->image('campus.jpg')])->json('url');

        $this->assertMatchesRegularExpression('#^/storage/school/\d{4}/\d{2}/fee-structure-[a-z0-9]{6}\.pdf$#', $pdf);

        $library = collect($this->actingAs($admin)->getJson('/admin/media')->assertOk()->json());
        $this->assertEqualsCanonicalizing([$pdf, $image], $library->pluck('url')->all(), 'resized copies are not listed');
        $this->assertSame('document', $library->firstWhere('url', $pdf)['kind']);

        auth()->logout();
        $this->getJson('/admin/media')->assertUnauthorized();
    }

    public function test_messages_can_be_read_toggled_and_deleted(): void
    {
        $admin = $this->admin();
        $message = ContactMessage::factory()->create();

        $this->actingAs($admin)
            ->get('/admin/messages')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Messages')
                ->has('messages.data', 1)
                ->missing('messages.data.0.ip_address'));

        $this->actingAs($admin)->patch("/admin/messages/{$message->id}")->assertRedirect();
        $this->assertNotNull($message->fresh()->read_at);

        $this->actingAs($admin)->patch("/admin/messages/{$message->id}");
        $this->assertNull($message->fresh()->read_at);

        $this->actingAs($admin)->delete("/admin/messages/{$message->id}")->assertSessionHas('success');
        $this->assertModelMissing($message);
    }

    public function test_admin_command_creates_and_updates_accounts(): void
    {
        $this->artisan('school:admin', ['email' => 'office@example.com', '--name' => 'Office', '--password' => 'first-password'])
            ->assertSuccessful();

        $user = User::query()->where('email', 'office@example.com')->sole();
        $this->assertTrue(Hash::check('first-password', $user->password));

        $this->artisan('school:admin', ['email' => 'office@example.com', '--password' => 'second-password'])
            ->assertSuccessful();

        $this->assertTrue(Hash::check('second-password', $user->fresh()->password));
        $this->assertSame('Office', $user->fresh()->name);

        $this->artisan('school:admin', ['email' => 'not-an-email', '--password' => 'short'])->assertFailed();
    }

    public function test_export_writes_admin_edits_into_the_school_config(): void
    {
        $path = storage_path('framework/testing/school.config.json');
        File::ensureDirectoryExists(dirname($path));
        File::put($path, json_encode([
            'theme' => 'classic',
            'school' => ['name' => 'Old Name', 'contact' => ['address' => 'Main Road']],
            'hero' => ['title' => 'Old headline'],
            'faqs' => [['question' => 'Q?', 'answer' => 'A.']],
        ]));

        SiteContent::factory()->create(['key' => 'school', 'value' => ['name' => 'New Name']]);
        SiteContent::factory()->create(['key' => 'about', 'value' => ['summary' => 'We teach.']]);
        SiteContent::factory()->create(['key' => 'hero', 'value' => ['title' => 'New headline']]);
        SiteContent::factory()->create(['key' => 'faqs', 'value' => []]);

        $this->artisan('school:export-content', ['--path' => $path])->assertSuccessful();

        $config = json_decode(File::get($path), true);
        File::delete($path);

        $this->assertSame('classic', $config['theme']);
        $this->assertSame(['name' => 'New Name', 'contact' => ['address' => 'Main Road'], 'about' => ['summary' => 'We teach.']], $config['school']);
        $this->assertSame(['title' => 'New headline'], $config['hero']);
        $this->assertArrayNotHasKey('faqs', $config);
    }
}
