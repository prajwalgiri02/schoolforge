<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Stores an admin upload on the public disk: images become responsive WebP
 * (see ImageOptimizer), documents for the Downloads page are kept as they are
 * under a readable, unique file name.
 */
class MediaUpload
{
    public const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'ico'];

    public const DOCUMENT_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt'];

    /**
     * Validation rules for an upload field.
     *
     * @return list<string>
     */
    public static function rules(): array
    {
        return ['required', 'file', 'mimes:'.implode(',', [...self::IMAGE_TYPES, ...self::DOCUMENT_TYPES]), 'max:10240'];
    }

    /**
     * Stores the file and returns its root-relative URL.
     */
    public static function store(UploadedFile $file, string $directory): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: (string) $file->extension());

        if (in_array($extension, self::DOCUMENT_TYPES, true)) {
            $name = (Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'document').'-'.Str::lower(Str::random(6)).'.'.$extension;
            $path = $file->storePubliclyAs($directory, $name, 'public');
        } else {
            $path = ImageOptimizer::store($file, $directory);
        }

        return parse_url(Storage::disk('public')->url($path), PHP_URL_PATH);
    }
}
