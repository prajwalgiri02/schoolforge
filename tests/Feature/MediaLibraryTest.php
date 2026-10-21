<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MediaLibraryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        Storage::fake('public');
        $this->actingAs(User::factory()->create());
    }

    public function test_uploads_are_listed_without_resized_copies(): void
    {
        $image = $this->post('/uploads', ['file' => UploadedFile::fake()->image('campus.jpg', 1600, 900)])->assertCreated()->json('url');
        $pdf = $this->post('/uploads', ['file' => UploadedFile::fake()->create('Prospectus 2027.pdf', 200, 'application/pdf')])->assertCreated()->json('url');

        $this->assertMatchesRegularExpression('#^/storage/studio/\d{4}/\d{2}/prospectus-2027-[a-z0-9]{6}\.pdf$#', $pdf);

        $library = collect($this->getJson('/media/library')->assertOk()->json());
        $this->assertEqualsCanonicalizing([$pdf, $image], $library->pluck('url')->all());
        $this->assertSame(['document', 'image'], $library->pluck('kind')->sort()->values()->all());
    }

    public function test_the_media_page_shows_usage_and_protects_used_files(): void
    {
        $used = $this->post('/uploads', ['file' => UploadedFile::fake()->image('hero.jpg')])->json('url');
        $unused = $this->post('/uploads', ['file' => UploadedFile::fake()->image('old.jpg')])->json('url');
        $project = Project::factory()->create();
        $project->update(['config' => [...$project->config, 'hero' => ['title' => 'Hi', 'image' => $used]]]);

        $this->get('/media')->assertInertia(fn (Assert $page) => $page
            ->component('Media/Index')
            ->where('items', fn ($items): bool => collect($items)->firstWhere('url', $used)['usedBy'] === [$project->name]
                && collect($items)->firstWhere('url', $unused)['usedBy'] === []));

        $path = fn (string $url): string => substr($url, strlen('/storage/'));

        $this->delete('/media', ['path' => $path($used)])->assertSessionHas('error');
        Storage::disk('public')->assertExists($path($used));

        $this->delete('/media', ['path' => $path($unused)])->assertSessionHas('success');
        Storage::disk('public')->assertMissing($path($unused));
        Storage::disk('public')->assertMissing(str_replace('.r.webp', '.480.webp', $path($unused)));

        $this->delete('/media', ['path' => '../.env'])->assertNotFound();
    }
}
