<?php

namespace App\Http\Controllers;

use App\Services\Generator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Moves themes between SchoolForge installations as one JSON file holding the
 * theme's settings, its extra CSS and its component overrides.
 */
class ThemeTransferController extends Controller
{
    public const FORMAT = 'schoolforge-theme';

    public function export(string $theme, Generator $generator): StreamedResponse
    {
        $directory = $generator->registryPath('themes', $theme);
        abort_unless(File::exists("{$directory}/theme.json"), 404);

        $bundle = [
            'format' => self::FORMAT,
            'version' => 1,
            'name' => $theme,
            'theme' => json_decode(File::get("{$directory}/theme.json"), true, flags: JSON_THROW_ON_ERROR),
            'extraCss' => File::exists("{$directory}/extra.css") ? File::get("{$directory}/extra.css") : '',
            'components' => collect(File::exists("{$directory}/components") ? File::allFiles("{$directory}/components") : [])
                ->mapWithKeys(fn ($file): array => [str_replace('\\', '/', $file->getRelativePathname()) => $file->getContents()])
                ->all(),
        ];

        return response()->streamDownload(
            fn () => print (json_encode($bundle, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n"),
            "{$theme}.theme.json",
            ['Content-Type' => 'application/json'],
        );
    }

    public function import(Request $request, Generator $generator): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:2048'],
            'name' => ['nullable', 'string', 'max:40', 'regex:/^[a-z][a-z0-9-]*$/'],
        ]);

        $bundle = json_decode((string) File::get($request->file('file')->getRealPath()), true);
        $fail = fn (string $message) => throw ValidationException::withMessages(['file' => $message]);

        if (! is_array($bundle) || ($bundle['format'] ?? null) !== self::FORMAT || ! is_array($bundle['theme'] ?? null)) {
            $fail('This is not a SchoolForge theme file. Export one from the Themes page of another Studio.');
        }

        $name = $request->input('name') ?: Str::slug((string) ($bundle['name'] ?? ''));
        $existing = array_column($generator->registry()['themes'], 'name');

        if (! preg_match('/^[a-z][a-z0-9-]*$/', $name)) {
            $fail('The theme needs a name of lowercase letters, numbers and dashes.');
        }

        if (in_array($name, $existing, true)) {
            $fail("A theme called “{$name}” already exists. Choose another name for the imported theme.");
        }

        if (filled($bundle['theme']['extends'] ?? null) && ! in_array($bundle['theme']['extends'], $existing, true)) {
            $fail("This theme builds on “{$bundle['theme']['extends']}”, which this Studio does not have. Import that theme first.");
        }

        $components = $bundle['components'] ?? [];
        $knownComponents = array_column($generator->registry()['components'], 'name');

        foreach ($components as $path => $contents) {
            if (! is_string($contents) || ! preg_match('#^([a-z0-9-]+)/[A-Za-z0-9_-]+\.(tsx|ts|css)$#', (string) $path, $match) || ! in_array($match[1], $knownComponents, true)) {
                $fail("The theme file contains an unexpected component file: {$path}.");
            }
        }

        $directory = $generator->registryPath('themes', $name);
        File::ensureDirectoryExists($directory);
        File::put("{$directory}/theme.json", json_encode([...$bundle['theme'], 'label' => $bundle['theme']['label'] ?? Str::headline($name)], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");

        if (filled($bundle['extraCss'] ?? null)) {
            File::put("{$directory}/extra.css", (string) $bundle['extraCss']);
        }

        foreach ($components as $path => $contents) {
            File::ensureDirectoryExists(dirname("{$directory}/components/{$path}"));
            File::put("{$directory}/components/{$path}", $contents);
        }

        $generator->refresh();

        return redirect()->route('themes.edit', $name)->with('success', 'Theme imported.');
    }
}
