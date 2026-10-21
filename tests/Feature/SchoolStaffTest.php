<?php

namespace Tests\Feature;

use App\Enums\StudioRole;
use App\Models\Project;
use App\Models\User;
use App\Support\HeadlessContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SchoolStaffTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_school_staff_edit_and_publish_their_own_school(): void
    {
        $school = Project::factory()->example()->create(['domain' => 'riverside.edu.np']);
        $staff = User::factory()->schoolStaff($school)->create();
        $this->actingAs($staff);

        $this->get('/')->assertRedirect("/projects/{$school->slug}/content");
        $this->get("/projects/{$school->slug}/content")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.role', 'school')
            ->where('auth.user.schoolSlug', $school->slug));

        $hero = $school->config['hero'];
        $this->put("/projects/{$school->slug}/content/hero", ['value' => [...$hero, 'title' => 'Welcome back']])->assertSessionHasNoErrors();
        $this->assertSame('Welcome back', $school->fresh()->config['hero']['title']);

        $this->get("/projects/{$school->slug}/pages")->assertOk();
        $this->get("/projects/{$school->slug}/history")->assertOk();
        $this->get("/preview/{$school->slug}/about")->assertOk();
        $this->post("/projects/{$school->slug}/publish")->assertSessionHas('success');
        $this->assertNotNull($school->fresh()->published_at);
    }

    public function test_school_staff_cannot_reach_other_schools_or_studio_settings(): void
    {
        $school = Project::factory()->create();
        $other = Project::factory()->create();
        $this->actingAs(User::factory()->schoolStaff($school)->create());

        foreach (["/projects/{$other->slug}/content", "/projects/{$other->slug}/publish", "/preview/{$other->slug}"] as $url) {
            $this->get($url)->assertForbidden();
        }
        $this->put("/projects/{$other->slug}/content/hero", ['value' => ['title' => 'Hacked']])->assertForbidden();

        foreach (['/projects/create', "/projects/{$school->slug}/design", "/projects/{$school->slug}/generate", "/projects/{$school->slug}/config.json", '/themes', '/components', '/media', '/status', '/billing', '/users'] as $url) {
            $this->get($url)->assertForbidden();
        }

        $this->post("/projects/{$school->slug}/duplicate")->assertForbidden();
        $this->delete("/projects/{$school->slug}/publish")->assertForbidden();
        $this->post("/projects/{$school->slug}/headless")->assertForbidden();
        $this->put("/projects/{$school->slug}/domain", ['domain' => 'mine.edu.np'])->assertForbidden();
        $this->delete("/projects/{$school->slug}")->assertForbidden();
    }

    public function test_school_staff_see_only_their_enquiries_and_not_the_content_token(): void
    {
        $school = Project::factory()->create();
        HeadlessContent::enable($school);
        $other = Project::factory()->create();
        $theirs = $school->siteSubmissions()->create(['form' => 'contact', 'reference' => 'MSG-26-AAAAAA', 'data' => ['name' => 'Sita']]);
        $notTheirs = $other->siteSubmissions()->create(['form' => 'contact', 'reference' => 'MSG-26-BBBBBB', 'data' => ['name' => 'Hari']]);
        $this->actingAs(User::factory()->schoolStaff($school)->create());

        $this->get("/projects/{$school->slug}/publish")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('submissions.data.0.reference', $theirs->reference)
            ->where('headless.token', null)
            ->where('headless.canManage', false));

        $this->patch("/projects/{$school->slug}/submissions/{$theirs->id}")->assertRedirect();
        $this->patch("/projects/{$other->slug}/submissions/{$notTheirs->id}")->assertForbidden();
        $this->patch("/projects/{$school->slug}/submissions/{$notTheirs->id}")->assertNotFound();
    }

    public function test_the_media_library_shows_school_staff_only_their_files(): void
    {
        $school = Project::factory()->create();
        $this->actingAs(User::factory()->schoolStaff($school)->create());

        $this->getJson('/media/library')->assertOk()->assertJsonCount(0);
    }

    public function test_staff_without_a_school_are_told_so(): void
    {
        $this->actingAs(User::factory()->create(['role' => StudioRole::School, 'project_id' => null]));

        $this->get('/')->assertForbidden();
    }

    public function test_owners_create_school_staff_for_a_school(): void
    {
        $school = Project::factory()->create();
        $this->actingAs(User::factory()->create());

        $this->post('/users', ['name' => 'Office', 'email' => 'office@school.edu.np', 'role' => 'school', 'password' => 'password123'])->assertSessionHasErrors(['project_id' => 'Choose the school this person looks after.']);
        $this->post('/users', ['name' => 'Office', 'email' => 'office@school.edu.np', 'role' => 'school', 'project_id' => $school->id, 'password' => 'password123'])->assertSessionHas('success');

        $staff = User::query()->where('email', 'office@school.edu.np')->sole();
        $this->assertTrue($staff->isSchoolStaff());
        $this->assertTrue($staff->project->is($school));

        $this->patch("/users/{$staff->id}", ['role' => 'editor'])->assertSessionHas('success');
        $this->assertNull($staff->fresh()->project_id);

        $this->get('/users')->assertInertia(fn (Assert $page) => $page->has('schools', 1)->where('roles.3.value', 'school'));
    }

    public function test_the_user_command_creates_school_staff(): void
    {
        $school = Project::factory()->create();

        $this->artisan('studio:user', ['email' => 'office@school.edu.np', '--password' => 'password123', '--role' => 'school'])->assertFailed();
        $this->artisan('studio:user', ['email' => 'office@school.edu.np', '--password' => 'password123', '--role' => 'school', '--school' => $school->slug])->assertSuccessful();

        $this->assertSame($school->id, User::query()->where('email', 'office@school.edu.np')->sole()->project_id);
    }

    public function test_deleting_a_school_unlinks_its_staff(): void
    {
        $school = Project::factory()->create();
        $staff = User::factory()->schoolStaff($school)->create();

        $school->delete();

        $this->assertNull($staff->fresh()->project_id);
    }
}
