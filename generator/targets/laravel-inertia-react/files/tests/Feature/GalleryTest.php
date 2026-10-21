<?php

namespace Tests\Feature;

use App\Models\SiteContent;
use App\Models\User;
use App\Support\SchoolSite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GalleryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
    }

    public function test_albums_added_in_the_admin_get_their_own_page(): void
    {
        $this->actingAs(User::factory()->create())->put('/admin/content/albums', ['value' => [
            ['title' => 'Sports Week', 'photos' => [['src' => '/storage/school/run.r.webp', 'caption' => 'Relay'], ['caption' => '']]],
            ['title' => 'वनभोज', 'description' => 'Picnic'],
        ]])->assertSessionHasNoErrors();

        $albums = SiteContent::query()->where('key', 'albums')->sole()->value;
        $this->assertSame('sports-week', $albums[0]['slug']);
        $this->assertSame([['src' => '/storage/school/run.r.webp', 'caption' => 'Relay']], $albums[0]['photos'], 'empty photos are dropped');
        $this->assertNotSame('', $albums[1]['slug']);

        $this->get('/gallery/sports-week')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('slug', '/gallery/sports-week')
                ->where('site.pages', fn ($pages): bool => collect($pages)->contains(
                    fn (array $page): bool => $page['slug'] === '/gallery/sports-week' && $page['sections'] === [['type' => 'album', 'albumSlug' => 'sports-week']],
                )));

        $this->get("/gallery/{$albums[1]['slug']}")->assertOk();
        $this->assertStringContainsString('/gallery/sports-week', $this->get('/sitemap.xml')->getContent());
    }

    public function test_removed_albums_lose_their_page(): void
    {
        $slugs = collect(app(SchoolSite::class)->data()['content']['albums'] ?? [])->pluck('slug');

        if ($slugs->isEmpty()) {
            $this->markTestSkipped('This school has no photo albums.');
        }

        $this->get("/gallery/{$slugs->first()}")->assertOk();

        $this->actingAs(User::factory()->create())->put('/admin/content/albums', ['value' => []])->assertSessionHasNoErrors();

        foreach ($slugs as $slug) {
            $this->get("/gallery/{$slug}")->assertNotFound();
        }
    }

    public function test_videos_need_a_title_and_link(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->put('/admin/content/videos', ['value' => [['title' => 'Tour']]])
            ->assertSessionHasErrors('value.0.url');

        $this->actingAs($admin)->put('/admin/content/videos', ['value' => [['title' => 'Tour', 'url' => 'https://youtu.be/aqz-KE-bpKQ']]])
            ->assertSessionHasNoErrors();

        $this->assertSame('https://youtu.be/aqz-KE-bpKQ', app(SchoolSite::class)->data()['content']['videos'][0]['url']);
    }
}
