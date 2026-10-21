<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Lists uploaded images and documents on the public disk so editors can reuse
 * them, without the smaller copies ImageOptimizer makes of each image.
 */
class MediaLibrary
{
    /**
     * @return list<array{path: string, url: string, name: string, kind: 'image'|'document', size: int, modified: int}>
     */
    public static function list(string $directory): array
    {
        $disk = Storage::disk('public');

        return collect($disk->allFiles($directory))
            ->reject(fn (string $path): bool => (bool) preg_match('/\.\d+\.webp$/', $path) || str_starts_with(basename($path), '.'))
            ->map(function (string $path) use ($disk): array {
                $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

                return [
                    'path' => $path,
                    'url' => parse_url($disk->url($path), PHP_URL_PATH),
                    'name' => Str::of(basename($path))->replace('.r.webp', '.webp')->value(),
                    'kind' => in_array($extension, MediaUpload::IMAGE_TYPES, true) ? 'image' : 'document',
                    'size' => $disk->size($path),
                    'modified' => $disk->lastModified($path),
                ];
            })
            ->sortByDesc('modified')
            ->values()
            ->all();
    }

    /**
     * Deletes an upload and its smaller copies. Returns false for paths outside the directory.
     */
    public static function delete(string $directory, string $path): bool
    {
        if (! str_starts_with($path, rtrim($directory, '/').'/') || str_contains($path, '..')) {
            return false;
        }

        Storage::disk('public')->delete([$path, ...ImageOptimizer::variantsOf($path)]);

        return true;
    }
}
