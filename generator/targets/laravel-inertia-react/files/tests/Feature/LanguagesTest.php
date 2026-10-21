<?php

namespace Tests\Feature;

use App\Models\SiteContent;
use App\Models\User;
use App\Support\SchoolSite;
use App\Support\TranslationMerger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LanguagesTest extends TestCase
{
    use RefreshDatabase;

    private string $locale;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);

        $site = app(SchoolSite::class);
        $extra = array_values(array_diff($site->locales(), [$site->defaultLocale()]));

        if ($extra === []) {
            $this->markTestSkipped('This school has a single language.');
        }

        $this->locale = $extra[0];
    }

    public function test_translated_pages_render_in_their_language(): void
    {
        $this->get("/{$this->locale}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('slug', '/')
                ->where('site.i18n.locale', $this->locale)
                ->where('site.i18n.basePath', "/{$this->locale}"));

        $this->get("/{$this->locale}/about")->assertOk()->assertInertia(fn (Assert $page) => $page->where('slug', '/about'));
        $this->get('/xx/about')->assertNotFound();
    }

    public function test_untranslated_admin_edits_flow_into_translations(): void
    {
        $site = app(SchoolSite::class);
        $translatedTitle = $site->data($this->locale)['content']['hero']['title'] ?? null;
        $admin = User::factory()->create();

        $this->actingAs($admin)->put('/admin/content/hero', ['value' => [
            ...$site->data()['content']['hero'],
            'image' => '/storage/school/new-banner.r.webp',
        ]])->assertSessionHasNoErrors();

        $translated = app(SchoolSite::class)->data($this->locale)['content']['hero'];
        $this->assertSame('/storage/school/new-banner.r.webp', $translated['image'], 'the new image is shown in every language');
        $this->assertSame($translatedTitle, $translated['title'], 'the translated headline is kept');
    }

    public function test_translations_store_only_what_changed(): void
    {
        $site = app(SchoolSite::class);
        $admin = User::factory()->create();
        $value = $site->data($this->locale)['content']['hero'];
        $value['subtitle'] = 'Translated subtitle';

        $this->actingAs($admin)
            ->get("/admin/content/hero?locale={$this->locale}")
            ->assertInertia(fn (Assert $page) => $page->where('locale', $this->locale)->where('isEdited', false));

        $this->actingAs($admin)->put("/admin/content/hero?locale={$this->locale}", ['value' => $value])->assertSessionHasNoErrors();

        $this->assertSame(['subtitle' => 'Translated subtitle'], SiteContent::query()->where('key', "{$this->locale}:hero")->sole()->value);
        $this->assertSame('Translated subtitle', app(SchoolSite::class)->data($this->locale)['content']['hero']['subtitle']);
        $this->assertNotSame('Translated subtitle', app(SchoolSite::class)->data()['content']['hero']['subtitle'] ?? null, 'the default language is untouched');

        $this->actingAs($admin)->delete("/admin/content/hero?locale={$this->locale}")->assertSessionHas('success');
        $this->assertDatabaseCount(SiteContent::class, 0);
    }

    public function test_sitemap_lists_every_language(): void
    {
        $this->get('/sitemap.xml')->assertOk()->assertSee(app(SchoolSite::class)->siteUrl()."/{$this->locale}/about", false);
    }

    public function test_translation_edits_are_exported_to_the_config(): void
    {
        $path = storage_path('framework/testing/languages.config.json');
        File::ensureDirectoryExists(dirname($path));
        File::put($path, json_encode(['school' => ['name' => 'School'], 'translations' => [$this->locale => ['hero' => ['title' => 'Old']]]]));

        SiteContent::factory()->create(['key' => "{$this->locale}:hero", 'value' => ['subtitle' => 'New subtitle']]);
        $this->artisan('school:export-content', ['--path' => $path])->assertSuccessful();

        $config = json_decode(File::get($path), true);
        File::delete($path);

        $this->assertSame(['title' => 'Old', 'subtitle' => 'New subtitle'], $config['translations'][$this->locale]['hero']);
    }

    public function test_merge_and_diff_rules(): void
    {
        $base = ['title' => 'Hello', 'items' => [['name' => 'A', 'image' => 'a.jpg'], ['name' => 'B', 'image' => 'b.jpg']], 'tags' => ['x', 'y']];
        $overlay = ['title' => 'नमस्ते', 'items' => [['name' => 'क']], 'tags' => ['z']];

        $merged = TranslationMerger::merge($base, $overlay);

        $this->assertSame(['title' => 'नमस्ते', 'items' => [['name' => 'क', 'image' => 'a.jpg'], ['name' => 'B', 'image' => 'b.jpg']], 'tags' => ['z']], $merged);
        $this->assertSame(['title' => 'नमस्ते', 'items' => [['name' => 'क'], []], 'tags' => ['z']], TranslationMerger::diff($base, $merged));
        $this->assertNull(TranslationMerger::diff($base, $base));
    }
}
