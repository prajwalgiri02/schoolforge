<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\User;
use App\Support\SchoolSite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CampusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
    }

    public function test_enquiries_can_name_a_campus(): void
    {
        Mail::fake();
        config(['school.contact_recipient' => 'office@example.com']);

        $this->post('/contact', [
            'name' => 'Sita Sharma',
            'email' => 'sita@example.com',
            'subject' => 'Campus visit',
            'campus' => 'Junior Campus, Kathmandu',
            'message' => 'Can we visit on Saturday?',
        ])->assertSessionHasNoErrors();

        $this->assertSame('Junior Campus, Kathmandu', ContactMessage::query()->sole()->campus);

        $this->post('/contact', ['name' => 'A', 'email' => 'a@example.com', 'message' => 'Hi', 'campus' => str_repeat('x', 121)])
            ->assertSessionHasErrors('campus');
    }

    public function test_admins_manage_campuses_shown_on_the_contact_page(): void
    {
        $this->actingAs(User::factory()->create())->put('/admin/content/campuses', ['value' => [
            ['name' => 'Pokhara Campus', 'address' => 'Lakeside, Pokhara', 'levels' => ['Grades 1–5', 'Grades 6–10']],
        ]])->assertSessionHasNoErrors();

        $this->assertSame(['Grades 1–5', 'Grades 6–10'], app(SchoolSite::class)->data()['content']['campuses'][0]['levels']);

        $this->get('/contact')->assertInertia(fn (Assert $page) => $page
            ->where('site.content.campuses.0.name', 'Pokhara Campus')
            ->where('site.pages', fn ($pages): bool => collect(collect($pages)->firstWhere('slug', '/contact')['sections'])->contains('type', 'campuses')));
    }
}
