<?php

namespace App\Support;

use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Stores uploaded photos as WebP in several widths so pages load fast on mobile
 * data. The main file is named `<name>.r.webp` and its smaller copies
 * `<name>.<width>.webp`; the website's Media component turns that convention
 * into a responsive srcset (see registry/runtime/ui.tsx).
 */
class ImageOptimizer
{
    /** Longest side of the main image. */
    public const MAX_WIDTH = 1920;

    /** Widths of the smaller copies used by srcset. */
    public const WIDTHS = [480, 960, 1440];

    public const QUALITY = 80;

    /**
     * Store an upload and return its path on the disk. Photos are converted to
     * responsive WebP; GIF and ICO files (animations, favicons) are kept as they are.
     */
    public static function store(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        $image = self::canOptimize($file) ? @imagecreatefromstring($file->get()) : false;

        if (! $image instanceof GdImage) {
            return $file->store($directory, $disk);
        }

        $image = self::applyExifOrientation($image, $file);
        $base = trim($directory, '/').'/'.Str::random(32);
        $storage = Storage::disk($disk);
        $storage->put("{$base}.r.webp", self::encode(self::resize($image, self::MAX_WIDTH)));

        foreach (self::WIDTHS as $width) {
            $storage->put("{$base}.{$width}.webp", self::encode(self::resize($image, $width)));
        }

        imagedestroy($image);

        return "{$base}.r.webp";
    }

    /**
     * Paths of the smaller copies that belong to an optimised image.
     *
     * @return list<string>
     */
    public static function variantsOf(string $path): array
    {
        if (! str_ends_with($path, '.r.webp')) {
            return [];
        }

        $base = substr($path, 0, -strlen('.r.webp'));

        return array_map(fn (int $width): string => "{$base}.{$width}.webp", self::WIDTHS);
    }

    private static function canOptimize(UploadedFile $file): bool
    {
        return function_exists('imagewebp') && in_array(strtolower($file->getClientOriginalExtension() ?: (string) $file->extension()), ['jpg', 'jpeg', 'png', 'webp'], true);
    }

    private static function resize(GdImage $image, int $maxWidth): GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width <= $maxWidth) {
            return $image;
        }

        $newHeight = (int) round($height * $maxWidth / $width);
        $resized = imagecreatetruecolor($maxWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $maxWidth, $newHeight, $width, $height);

        return $resized;
    }

    private static function encode(GdImage $image): string
    {
        ob_start();
        imagewebp($image, null, self::QUALITY);

        return (string) ob_get_clean();
    }

    /**
     * Phone photos are often stored sideways with a rotation flag; apply it.
     */
    private static function applyExifOrientation(GdImage $image, UploadedFile $file): GdImage
    {
        if (! function_exists('exif_read_data') || ! in_array(strtolower((string) $file->extension()), ['jpg', 'jpeg'], true)) {
            return $image;
        }

        $orientation = @exif_read_data($file->getRealPath())['Orientation'] ?? 1;
        $rotated = match ($orientation) {
            3 => imagerotate($image, 180, 0),
            6 => imagerotate($image, -90, 0),
            8 => imagerotate($image, 90, 0),
            default => $image,
        };

        return $rotated instanceof GdImage ? $rotated : $image;
    }
}
