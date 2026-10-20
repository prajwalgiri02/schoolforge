<?php

namespace Tests\Concerns;

use App\Services\Generator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * Runs a test against a throwaway copy of the generator, so tests that create
 * themes or components never touch the real registry. Laravel calls the
 * setUp/tearDown methods below automatically because they are named after the trait.
 */
trait UsesTemporaryGenerator
{
    protected string $generatorPath;

    protected function setUpUsesTemporaryGenerator(): void
    {
        $this->generatorPath = storage_path('framework/testing/generator-'.Str::random(8));

        foreach (['bin', 'src', 'registry', 'targets', 'examples'] as $directory) {
            File::copyDirectory(base_path("generator/{$directory}"), "{$this->generatorPath}/{$directory}");
        }

        File::copy(base_path('generator/package.json'), "{$this->generatorPath}/package.json");

        config(['studio.generator_path' => $this->generatorPath]);
        $this->app->forgetInstance(Generator::class);

        $this->assertStringStartsWith($this->generatorPath, app(Generator::class)->registryPath(), 'Tests must never write to the real generator registry.');
    }

    protected function tearDownUsesTemporaryGenerator(): void
    {
        File::deleteDirectory($this->generatorPath);
    }
}
