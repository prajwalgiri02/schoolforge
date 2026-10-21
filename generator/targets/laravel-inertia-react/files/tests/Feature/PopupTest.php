<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\SchoolSite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PopupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
    }

    public function test_the_popup_is_part_of_every_page_layout(): void
    {
        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('site.layout.footer', fn ($footer): bool => collect($footer)->contains('type', 'popup')));
    }

    public function test_admins_can_schedule_and_turn_off_the_popup(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->put('/admin/content/popup', ['value' => [
            'title' => 'School closed on Friday',
            'message' => 'Due to heavy rain.',
            'startDate' => '2026-07-01',
            'endDate' => '2026-07-03',
            'everyVisit' => false,
        ]])->assertSessionHasNoErrors();

        $popup = app(SchoolSite::class)->data()['content']['popup'];
        $this->assertSame('School closed on Friday', $popup['title']);
        $this->assertSame('2026-07-03', $popup['endDate']);

        $this->actingAs($admin)->put('/admin/content/popup', ['value' => ['endDate' => '3 July']])
            ->assertSessionHasErrors('value.endDate');

        $this->actingAs($admin)->put('/admin/content/popup', ['value' => ['title' => '', 'message' => '']])->assertSessionHasNoErrors();
        $this->assertEmpty(app(SchoolSite::class)->data()['content']['popup'] ?? null);
    }
}
