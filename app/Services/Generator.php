<?php

namespace App\Services;

use Closure;
use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Bridge to the SchoolForge generator CLI in /generator. Studio never re-implements
 * generator logic; it asks the CLI so previews and generated code always agree.
 */
class Generator
{
    /**
     * @var array{themes: list<array<string, mixed>>, components: list<array<string, mixed>>, targets: list<array{name: string, label: string}>}|null
     */
    private ?array $registry = null;

    public function __construct(
        private readonly string $path,
        private readonly string $node,
    ) {}

    /**
     * Themes (with resolved tokens), components and targets in the registry.
     *
     * @return array{themes: list<array<string, mixed>>, components: list<array<string, mixed>>, targets: list<array{name: string, label: string}>}
     */
    public function registry(): array
    {
        return $this->registry ??= $this->json(['inspect']);
    }

    /**
     * Forget cached registry data after a theme or component changes.
     */
    public function refresh(): void
    {
        $this->registry = null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function theme(string $name): ?array
    {
        return collect($this->registry()['themes'])->firstWhere('name', $name);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function component(string $name): ?array
    {
        return collect($this->registry()['components'])->firstWhere('name', $name);
    }

    /**
     * Validates a school config and returns the site data and design tokens a
     * generated project would use.
     *
     * @param  array<string, mixed>  $config
     * @return array{ok: bool, errors: list<string>, warnings: list<string>, site?: array<string, mixed>, tokens?: array<string, mixed>, extraCss?: string}
     */
    public function preview(array $config): array
    {
        return $this->json(['preview', '--config', '-'], json_encode($config, JSON_THROW_ON_ERROR));
    }

    public function newTheme(string $name, string $from, ?string $label = null): void
    {
        $this->run(['new', 'theme', $name, '--from', $from, ...($label ? ['--label', $label] : [])]);
        $this->refresh();
    }

    /**
     * @param  list<string>  $variants
     */
    public function newComponent(string $name, array $variants, ?string $label = null): void
    {
        $this->run(['new', 'component', $name, '--variants', implode(',', $variants), ...($label ? ['--label', $label] : [])]);
        $this->refresh();
    }

    /**
     * Generates a new project, or syncs an existing generated project, at `$directory`.
     *
     * @param  array<string, mixed>  $config
     * @param  Closure(string): void  $output  Receives CLI output as it is produced.
     */
    public function generate(array $config, string $directory, bool $install, Closure $output): ProcessResult
    {
        $isExisting = File::exists($directory.'/.schoolforge.json');

        if ($isExisting) {
            File::put($directory.'/school.config.json', json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");

            return $this->stream(['sync', '--project', $directory], $output);
        }

        $configFile = storage_path('app/private/'.Str::uuid().'.json');
        File::ensureDirectoryExists(dirname($configFile));
        File::put($configFile, json_encode($config, JSON_THROW_ON_ERROR));

        try {
            return $this->stream(['create', $directory, '--config', $configFile, ...($install ? ['--build'] : ['--skip-install'])], $output);
        } finally {
            File::delete($configFile);
        }
    }

    public function registryPath(string ...$segments): string
    {
        return implode(DIRECTORY_SEPARATOR, [$this->path, 'registry', ...$segments]);
    }

    /**
     * @param  list<string>  $arguments
     * @return array<string, mixed>
     */
    private function json(array $arguments, ?string $input = null): array
    {
        return json_decode($this->run($arguments, $input)->output(), true, flags: JSON_THROW_ON_ERROR);
    }

    /**
     * @param  list<string>  $arguments
     */
    private function run(array $arguments, ?string $input = null): ProcessResult
    {
        $process = Process::path($this->path)->timeout(60);
        $result = ($input === null ? $process : $process->input($input))->run([$this->node, 'bin/schoolforge.js', ...$arguments]);

        if ($result->failed()) {
            throw new RuntimeException(trim($result->errorOutput()) ?: 'The SchoolForge generator failed.');
        }

        return $result;
    }

    /**
     * @param  list<string>  $arguments
     * @param  Closure(string): void  $output
     */
    private function stream(array $arguments, Closure $output): ProcessResult
    {
        return Process::path($this->path)
            ->timeout(config('studio.timeout'))
            ->env(['FORCE_COLOR' => '0', 'COMPOSER_NO_INTERACTION' => '1'])
            ->run([$this->node, 'bin/schoolforge.js', ...$arguments], fn (string $type, string $buffer) => $output($buffer));
    }
}
