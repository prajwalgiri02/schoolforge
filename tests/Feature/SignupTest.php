<?php

namespace Tests\Feature;

use App\Enums\StudioRole;
use App\Models\AuditEvent;
use App\Models\Project;
use App\Models\User;
use App\Support\Billing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SignupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['studio.signup' => true]);
    }

    /**
     * @return array<string, string>
     */
    private function signup(array $overrides = []): array
    {
        return [
            'school_name' => 'Gyan Jyoti School',
            'address' => 'Baneshwor, Kathmandu',
            'phone' => '01-4567890',
            'name' => 'Sita Sharma',
            'email' => 'sita@gyanjyoti.edu.np',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
            ...$overrides,
        ];
    }

    public function test_signup_is_off_unless_enabled(): void
    {
        config(['studio.signup' => false]);

        $this->get('/signup')->assertNotFound();
        $this->post('/signup', $this->signup())->assertForbidden();
        $this->get('/login')->assertInertia(fn (Assert $page) => $page->where('signupEnabled', false));

        $this->assertDatabaseCount(Project::class, 0);
    }

    public function test_a_school_signs_up_and_starts_from_the_example_school(): void
    {
        $this->get('/login')->assertInertia(fn (Assert $page) => $page->where('signupEnabled', true));
        $this->get('/signup')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Auth/Signup'));

        $response = $this->post('/signup', $this->signup());

        $project = Project::query()->sole();
        $user = User::query()->where('email', 'sita@gyanjyoti.edu.np')->sole();
        $response->assertRedirect("/projects/{$project->slug}/welcome");
        $this->assertAuthenticatedAs($user);

        $this->assertSame('gyan-jyoti-school', $project->slug);
        $this->assertSame(StudioRole::School, $user->role);
        $this->assertTrue($user->project->is($project));
        $this->assertTrue($project->needsOnboarding());
        $this->assertSame('sita@gyanjyoti.edu.np', $project->billing_email);
        $this->assertNull($project->plan_id);

        $school = $project->config['school'];
        $this->assertSame('Gyan Jyoti School', $school['name']);
        $this->assertSame(['address' => 'Baneshwor, Kathmandu', 'phone' => ['01-4567890'], 'email' => ['sita@gyanjyoti.edu.np']], $school['contact']);
        $this->assertArrayNotHasKey('logo', $school);
        $this->assertArrayNotHasKey('social', $school);
        $this->assertNotEmpty($project->config['news'], 'starts with sample content to edit');
        $this->assertStringNotContainsString('Riverside Heights', json_encode($project->config), 'the example school is renamed');
        $this->assertArrayNotHasKey('siteUrl', $project->config['seo'] ?? []);

        $this->assertTrue(AuditEvent::query()->where('action', 'schools.signed-up')->where('project_id', $project->id)->where('user_id', $user->id)->exists());
        $this->get('/')->assertRedirect("/projects/{$project->slug}/welcome");
    }

    public function test_signups_start_from_the_chosen_template_with_a_seven_day_trial(): void
    {
        $template = Project::factory()->example()->create(['is_template' => true]);
        $template->update(['config' => [...$template->config, 'theme' => 'modern', 'colors' => ['primary' => '#7f1d1d']]]);
        Project::factory()->create(['is_template' => true, 'name' => 'Other template']);
        config(['studio.signup_template' => $template->slug]);

        $this->post('/signup', $this->signup(['address' => '', 'phone' => '']))->assertSessionHasNoErrors();

        $project = Project::query()->where('signed_up_at', '!=', null)->sole();
        $this->assertSame('modern', $project->theme());
        $this->assertSame('#7f1d1d', $project->config['colors']['primary']);
        $this->assertSame(['email' => ['sita@gyanjyoti.edu.np']], $project->config['school']['contact']);
        $this->assertNull($project->plan_id);
        $this->assertNull($project->paid_until);
        $this->assertTrue($project->trial_ends_at->isSameDay(now()->addDays(7)));
        $this->assertTrue(Billing::needsPackage($project));
        $this->assertFalse(Billing::trialEnded($project));
    }

    public function test_signup_validation_and_bots(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->post('/signup', $this->signup(['school_name' => '', 'email' => 'taken@example.com', 'password_confirmation' => 'different']))
            ->assertSessionHasErrors(['school_name', 'email', 'password']);
        $this->post('/signup', $this->signup(['website' => 'https://spam.example']))->assertSessionHasErrors('website');

        $this->assertDatabaseCount(Project::class, 0);
        $this->assertGuest();
    }

    public function test_signups_are_rate_limited(): void
    {
        foreach (range(1, 5) as $attempt) {
            $this->post('/signup', $this->signup(['email' => "head{$attempt}@example.com"]));
            auth()->logout();
        }

        $this->post('/signup', $this->signup(['email' => 'late@example.com']))->assertTooManyRequests();

        $this->from('/signup')
            ->post('/signup', $this->signup(['email' => 'late@example.com']), ['X-Inertia' => 'true'])
            ->assertRedirect('/signup')
            ->assertSessionHasErrors(['school_name' => 'Too many attempts. Please wait 60 minutes and try again.']);
    }

    public function test_reserved_names_do_not_become_studio_subdomains(): void
    {
        $this->post('/signup', $this->signup(['school_name' => 'Studio']));

        $this->assertSame('studio-school', Project::query()->sole()->slug);
    }

    public function test_school_staff_finish_onboarding(): void
    {
        $this->post('/signup', $this->signup());
        $project = Project::query()->sole();

        $this->get("/projects/{$project->slug}/welcome")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Projects/Onboarding')
            ->where('project.needsOnboarding', true)
            ->where('values.name', 'Gyan Jyoti School')
            ->where('values.phone', '01-4567890')
            ->has('themes'));

        $values = [
            'name' => 'Gyan Jyoti Secondary School',
            'tagline' => 'Learning with values',
            'established' => '1998',
            'logo' => '/media/2026/10/logo.webp',
            'address' => 'Baneshwor, Kathmandu',
            'phone' => '01-4567890',
            'email' => 'info@gyanjyoti.edu.np',
            'summary' => 'A school for curious minds.',
            'principal_name' => 'Ram Thapa',
            'principal_message' => "Welcome to our school.\n\nWe are glad you are here.",
            'theme' => 'playful',
            'primary_color' => '#0f766e',
        ];

        $this->put("/projects/{$project->slug}/welcome", [...$values, 'established' => '98', 'theme' => 'unknown'])
            ->assertSessionHasErrors(['established', 'theme']);

        $this->put("/projects/{$project->slug}/welcome", $values)->assertRedirect("/projects/{$project->slug}/content");

        $project->refresh();
        $school = $project->config['school'];
        $this->assertFalse($project->needsOnboarding());
        $this->assertSame('Gyan Jyoti Secondary School', $project->name);
        $this->assertSame(1998, $school['established']);
        $this->assertSame('/media/2026/10/logo.webp', $school['logo']);
        $this->assertSame(['info@gyanjyoti.edu.np'], $school['contact']['email']);
        $this->assertSame('A school for curious minds.', $school['about']['summary']);
        $this->assertSame(['Welcome to our school.', 'We are glad you are here.'], $school['principal']['message']);
        $this->assertSame('Ram Thapa', $school['principal']['name']);
        $this->assertSame('playful', $project->theme());
        $this->assertSame(['primary' => '#0f766e'], $project->config['colors']);
        $this->assertSame('Finished the first-run setup', $project->versions()->latest('id')->first()->summary);

        $this->actingAs(User::query()->sole())->get('/')->assertRedirect("/projects/{$project->slug}/content");

        $this->put("/projects/{$project->slug}/welcome", [...$values, 'tagline' => '', 'primary_color' => ''])->assertSessionHasNoErrors();
        $this->assertArrayNotHasKey('tagline', $project->fresh()->config['school']);
        $this->assertArrayNotHasKey('colors', $project->fresh()->config);

        config(['studio.hosting_domain' => 'schools.test']);
        $this->get("/projects/{$project->slug}/welcome")->assertInertia(fn (Assert $page) => $page->where('websiteUrl', 'https://gyan-jyoti-school.schools.test'));
        $this->get("/preview/{$project->slug}/about")->assertOk();
        $this->post("/projects/{$project->slug}/publish")->assertRedirect("/projects/{$project->slug}/package");
        $this->assertNull($project->fresh()->published_at);
    }

    public function test_school_staff_cannot_onboard_another_school(): void
    {
        $other = Project::factory()->create();
        $this->actingAs(User::factory()->schoolStaff(Project::factory()->create())->create());

        $this->get("/projects/{$other->slug}/welcome")->assertForbidden();
        $this->put("/projects/{$other->slug}/welcome", ['name' => 'Taken', 'theme' => 'classic'])->assertForbidden();
    }

    public function test_viewers_cannot_save_onboarding(): void
    {
        $project = Project::factory()->create();
        $this->actingAs(User::factory()->create(['role' => StudioRole::Viewer]));

        $this->put("/projects/{$project->slug}/welcome", ['name' => 'X', 'theme' => 'classic'])->assertForbidden();
    }
}
