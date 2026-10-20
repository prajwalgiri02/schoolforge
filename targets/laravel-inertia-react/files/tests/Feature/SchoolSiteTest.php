<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Support\SchoolSite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SchoolSiteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_every_generated_page_renders(): void
    {
        foreach (app(SchoolSite::class)->data()['pages'] as $page) {
            $this->get($page['slug'])
                ->assertOk()
                ->assertInertia(fn (Assert $inertia) => $inertia
                    ->component('School/Page')
                    ->where('slug', $page['slug'])
                    ->has('site.pages'));
        }
    }

    public function test_unknown_page_returns_not_found(): void
    {
        $this->get('/this-page-does-not-exist')->assertNotFound();
    }

    public function test_health_check_is_not_captured_by_page_route(): void
    {
        $this->get('/up')->assertOk();
    }

    public function test_contact_enquiry_is_stored(): void
    {
        $this->from('/contact')
            ->post('/contact', [
                'name' => 'Asha Sharma',
                'email' => 'asha@example.com',
                'phone' => '+977 9800000000',
                'subject' => 'Admissions enquiry',
                'message' => 'We would like to visit the campus next week.',
            ])
            ->assertRedirect('/contact')
            ->assertSessionHas('success');

        $this->assertDatabaseHas(ContactMessage::class, [
            'email' => 'asha@example.com',
            'subject' => 'Admissions enquiry',
        ]);
    }

    public function test_contact_enquiry_requires_name_email_and_message(): void
    {
        $this->from('/contact')
            ->post('/contact', ['email' => 'not-an-email'])
            ->assertRedirect('/contact')
            ->assertSessionHasErrors(['name', 'email', 'message']);

        $this->assertDatabaseCount(ContactMessage::class, 0);
    }

    public function test_contact_subject_defaults_when_missing(): void
    {
        $this->post('/contact', [
            'name' => 'Ravi',
            'email' => 'ravi@example.com',
            'message' => 'Hello!',
        ])->assertSessionHasNoErrors();

        $this->assertSame('General question', ContactMessage::sole()->subject);
    }
}
