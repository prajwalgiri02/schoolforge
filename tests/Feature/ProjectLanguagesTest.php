<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectLanguagesTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->actingAs(User::factory()->create());
        $this->project = Project::factory()->create();
        $this->project->update(['config' => [
            ...$this->project->config,
            'languages' => ['en', 'ne'],
            'hero' => ['title' => 'Welcome to our school', 'subtitle' => 'Learning for life'],
        ]]);
    }

    public function test_languages_and_calendars_are_saved_from_the_design_tab(): void
    {
        $this->put("/projects/{$this->project->slug}/design", [
            'theme' => 'classic',
            'languages' => ['ne', 'en'],
            'calendars' => ['ne' => 'bs', 'en' => ''],
        ])->assertSessionHasNoErrors();

        $config = $this->project->fresh()->config;
        $this->assertSame(['ne', 'en'], $config['languages']);
        $this->assertSame(['ne' => 'bs'], $config['calendars']);

        $this->put("/projects/{$this->project->slug}/design", ['theme' => 'classic', 'languages' => ['en', 'xx']])
            ->assertSessionHasErrors('languages.1');
    }

    public function test_removing_a_language_drops_its_translations(): void
    {
        $this->project->update(['config' => [...$this->project->config, 'translations' => ['ne' => ['hero' => ['title' => 'स्वागत छ']]]]]);

        $this->put("/projects/{$this->project->slug}/design", ['theme' => 'classic', 'languages' => ['en']])->assertSessionHasNoErrors();

        $config = $this->project->fresh()->config;
        $this->assertArrayNotHasKey('languages', $config);
        $this->assertArrayNotHasKey('translations', $config);
    }

    public function test_translated_content_stores_only_what_changed(): void
    {
        $english = $this->project->config['hero'];

        $this->get("/projects/{$this->project->slug}/content/hero?locale=ne")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'ne')
                ->where('languages', ['en', 'ne'])
                ->where('value.title', $english['title']));

        $this->put("/projects/{$this->project->slug}/content/hero?locale=ne", ['value' => [...$english, 'title' => 'स्वागत छ']])
            ->assertSessionHasNoErrors();

        $config = $this->project->fresh()->config;
        $this->assertSame(['hero' => ['title' => 'स्वागत छ']], $config['translations']['ne']);
        $this->assertSame($english['title'], $config['hero']['title'], 'the default language is untouched');

        $this->get("/projects/{$this->project->slug}/content/hero?locale=ne")
            ->assertInertia(fn (Assert $page) => $page->where('value.title', 'स्वागत छ'));

        $this->put("/projects/{$this->project->slug}/content/hero?locale=ne", ['value' => $english])->assertSessionHasNoErrors();
        $this->assertArrayNotHasKey('translations', $this->project->fresh()->config);
    }

    public function test_unknown_locales_edit_the_default_language(): void
    {
        $this->get("/projects/{$this->project->slug}/content/hero?locale=fr")
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'en'));
    }

    public function test_page_titles_can_be_translated(): void
    {
        $this->put("/projects/{$this->project->slug}/pages", [
            'pages' => [
                ['slug' => '/', 'title' => 'Home', 'sections' => [['type' => 'hero']]],
                ['slug' => '/about', 'title' => 'About', 'sections' => [['type' => 'page-header']]],
            ],
            'translations' => ['ne' => [
                '/about' => ['title' => 'हाम्रो बारेमा', 'navLabel' => ''],
                '/' => ['title' => ''],
                '/gone' => ['title' => 'हराएको'],
            ]],
        ])->assertSessionHasNoErrors();

        $this->assertSame(['/about' => ['title' => 'हाम्रो बारेमा']], $this->project->fresh()->config['translations']['ne']['pages']);

        $this->get("/projects/{$this->project->slug}/pages")
            ->assertInertia(fn (Assert $page) => $page->where('pageTranslations.ne./about.title', 'हाम्रो बारेमा'));

        $this->get("/preview/{$this->project->slug}/ne/about")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('slug', '/about')
                ->where('site.i18n.locale', 'ne')
                ->where('site.pages.1.title', 'हाम्रो बारेमा'));
    }
}
