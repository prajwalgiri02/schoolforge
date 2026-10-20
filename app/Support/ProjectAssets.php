<?php

namespace App\Support;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Images uploaded in Studio live in Studio's public storage. When a project is
 * generated they are copied into the new codebase at the same URL path, so the
 * school's content works there unchanged.
 */
class ProjectAssets
{
    public const DIRECTORY = 'studio';

    /**
     * Every Studio upload referenced anywhere in a config, as paths on the public disk.
     *
     * @param  array<string, mixed>  $config
     * @return list<string>
     */
    public static function referencedFiles(array $config): array
    {
        $prefix = parse_url(Storage::disk('public')->url(self::DIRECTORY.'/'), PHP_URL_PATH);
        $files = [];

        array_walk_recursive($config, function (mixed $value) use ($prefix, &$files): void {
            if (is_string($value) && str_starts_with($value, $prefix) && ! str_contains($value, '..')) {
                $files[] = self::DIRECTORY.'/'.substr($value, strlen($prefix));
            }
        });

        return array_values(array_unique(array_filter($files, fn (string $file): bool => Storage::disk('public')->exists($file))));
    }

    /**
     * Copy referenced uploads into a generated project and return how many were copied.
     *
     * @param  array<string, mixed>  $config
     */
    public static function copyInto(array $config, string $projectDirectory, string $target): int
    {
        $publicRoot = $target === 'nextjs'
            ? $projectDirectory.'/public/storage'
            : $projectDirectory.'/storage/app/public';
        $files = self::referencedFiles($config);

        foreach ($files as $file) {
            $destination = $publicRoot.'/'.$file;
            File::ensureDirectoryExists(dirname($destination));
            File::copy(Storage::disk('public')->path($file), $destination);
        }

        return count($files);
    }
}
