<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PreviewAdminTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->actingAs(User::factory()->create(['name' => 'Studio Owner', 'email' => 'owner@example.test']));
        $this->project = Project::factory()->example()->create();
    }

    public function test_dashboard_shows_an_empty_inbox_and_the_schools_pages(): void
    {
        $slug = $this->project->slug;

        $this->get("/preview/{$slug}/admin")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->where('schoolName', 'Riverside Heights School')
                ->where('adminUrl', "/preview/{$slug}/admin")
                ->where('siteUrl', "/preview/{$slug}")
                ->where('studioUrl', "/projects/{$slug}")
                ->where('auth.user.email', 'owner@example.test')
                ->where('auth.user.isAdmin', true)
                ->where('inbox', ['messages' => 0, 'submissions' => 0])
                ->where('pageCount', fn (int $count) => $count > 5)
                ->where('stats.0', ['key' => 'messages', 'label' => 'New enquiries', 'value' => 0])
                ->where('stats.2', ['key' => 'updated', 'label' => 'Last edited', 'value' => null])
                ->where('checklist', fn ($steps) => collect($steps)->reject->done->pluck('key')->values()->all() === ['logo'])
                ->where('sectionCount', fn (int $count) => $count > 20)
                ->where('editedCount', 0)
                ->where('recentMessages', [])
                ->where('recentSubmissions', [])
                ->where('recentEdits', []));
    }

    public function test_dashboard_checklist_shows_what_a_new_school_still_has_to_fill_in(): void
    {
        $config = $this->project->config;
        $config['news'] = [];
        $this->project->update(['config' => $config]);

        $this->get("/preview/{$this->project->slug}/admin")
            ->assertInertia(fn (Assert $page) => $page
                ->where('checklist', fn ($steps) => collect($steps)->reject->done->pluck('key')->values()->all() === ['logo', 'news']));
    }

    public function test_content_page_lists_the_schools_content_sections(): void
    {
        $this->get("/preview/{$this->project->slug}/admin/content")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Content/Index')
                ->where('sections', fn ($sections) => collect($sections)->firstWhere('key', 'programs')['count'] === 6));
    }

    public function test_content_editor_shows_section_values_and_translations(): void
    {
        $slug = $this->project->slug;

        $this->get("/preview/{$slug}/admin/content/programs")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Content/Edit')
                ->where('sectionKey', 'programs')
                ->where('value.0.name', 'Early Years')
                ->where('locale', 'en')
                ->where('locales', ['en', 'ne'])
                ->where('isEdited', false)
                ->has('icons'));

        $this->get("/preview/{$slug}/admin/content/programs?locale=ne")
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'ne')
                ->where('value.0.name', 'प्रारम्भिक कक्षा'));

        $this->get("/preview/{$slug}/admin/content/unknown")->assertNotFound();
    }

    public function test_every_other_admin_page_can_be_previewed(): void
    {
        $slug = $this->project->slug;

        $this->get("/preview/{$slug}/admin/website")
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Website')
                ->where('pages', fn ($pages) => collect($pages)->contains('slug', '/about') && ! collect($pages)->contains(fn (array $item) => str_starts_with($item['slug'], '/news/'))));

        $this->get("/preview/{$slug}/admin/messages")->assertInertia(fn (Assert $page) => $page->component('Admin/Messages')->where('messages.data', [])->where('messages.total', 0));
        $this->get("/preview/{$slug}/admin/submissions")->assertInertia(fn (Assert $page) => $page->component('Admin/Submissions/Index')->has('types')->where('submissions.data', []));
        $this->get("/preview/{$slug}/admin/submissions?type=unknown")->assertNotFound();
        $this->get("/preview/{$slug}/admin/alerts")->assertInertia(fn (Assert $page) => $page->component('Admin/Alerts')->where('subscriberCount', 0));
        $this->get("/preview/{$slug}/admin/staff")->assertInertia(fn (Assert $page) => $page->component('Admin/Staff')->where('staff.0.email', 'owner@example.test')->has('roles', 2));
        $this->get("/preview/{$slug}/admin/account")->assertInertia(fn (Assert $page) => $page->component('Admin/Security')->where('twoFactorEnabled', false));
        $this->get("/preview/{$slug}/admin/login")->assertInertia(fn (Assert $page) => $page->component('Admin/Login'));
        $this->get("/preview/{$slug}/admin/forgot-password")->assertInertia(fn (Assert $page) => $page->component('Admin/ForgotPassword'));
        $this->get("/preview/{$slug}/admin/two-factor")->assertInertia(fn (Assert $page) => $page->component('Admin/TwoFactorChallenge'));
        $this->getJson("/preview/{$slug}/admin/media")->assertExactJson([]);
    }

    public function test_nothing_is_saved_from_the_preview(): void
    {
        $slug = $this->project->slug;
        $config = $this->project->config;

        $this->from("/preview/{$slug}/admin/content/programs")
            ->put("/preview/{$slug}/admin/content/programs", ['value' => []])
            ->assertRedirect("/preview/{$slug}/admin/content/programs")
            ->assertSessionHas('success', 'This is a preview, so nothing was saved.');

        $this->from("/preview/{$slug}/admin/messages")
            ->get("/preview/{$slug}/admin/messages/export.csv")
            ->assertRedirect("/preview/{$slug}/admin/messages")
            ->assertSessionHas('success', 'Downloads are not available in the preview.');

        $this->postJson("/preview/{$slug}/admin/uploads")->assertUnprocessable()->assertJsonValidationErrors('file');
        $this->post("/preview/{$slug}/admin/logout")->assertRedirect("/preview/{$slug}/admin/login");
        $this->post("/preview/{$slug}/admin/login")->assertRedirect("/preview/{$slug}/admin");

        $this->assertSame($config, $this->project->fresh()->config);
    }

    public function test_school_staff_cannot_preview_the_admin_panel(): void
    {
        $this->actingAs(User::factory()->schoolStaff($this->project)->create());

        $this->get("/preview/{$this->project->slug}/admin")->assertForbidden();
        $this->get("/preview/{$this->project->slug}/about")->assertOk();
    }

    public function test_guests_are_sent_to_sign_in(): void
    {
        auth()->logout();

        $this->get("/preview/{$this->project->slug}/admin")->assertRedirect('/login');
    }
}
