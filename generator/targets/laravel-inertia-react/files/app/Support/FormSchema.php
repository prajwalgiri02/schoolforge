<?php

namespace App\Support;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Reads the website's form definitions (resources/js/school/runtime/forms.json,
 * shared with the React forms) and turns them into Laravel validation rules.
 */
class FormSchema
{
    /** @var array<string, array<string, mixed>>|null */
    private static ?array $definitions = null;

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function all(): array
    {
        return self::$definitions ??= json_decode(File::get(resource_path('js/school/runtime/forms.json')), true);
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function find(string $type): ?array
    {
        return self::all()[$type] ?? null;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function fields(string $type): array
    {
        return collect(self::find($type)['steps'] ?? [])->flatMap(fn (array $step): array => $step['fields'])->values()->all();
    }

    /**
     * @return list<string>
     */
    public static function statuses(string $type): array
    {
        return self::find($type)['statuses'] ?? [];
    }

    /**
     * @return array<string, list<mixed>>
     */
    public static function rules(string $type): array
    {
        $rules = [];

        foreach (self::fields($type) as $field) {
            $presence = ($field['required'] ?? false) ? 'required' : 'nullable';

            $rules[$field['name']] = match ($field['type']) {
                'file' => [$presence, 'file', 'mimes:'.implode(',', $field['accept'] ?? ['pdf']), 'max:'.(($field['maxSizeMb'] ?? 5) * 1024)],
                'checkbox' => ($field['required'] ?? false) ? ['accepted'] : ['nullable', 'boolean'],
                'email' => [$presence, 'email', 'max:'.($field['max'] ?? 190)],
                'date' => [$presence, 'date_format:Y-m-d'],
                'select' => [$presence, Rule::in(array_column($field['options'] ?? [], 'value'))],
                default => [$presence, 'string', 'max:'.($field['max'] ?? 255)],
            };
        }

        return $rules;
    }

    /**
     * Labels for error messages, in English.
     *
     * @return array<string, string>
     */
    public static function attributes(string $type): array
    {
        return collect(self::fields($type))->mapWithKeys(fn (array $field): array => [$field['name'] => Str::lower($field['label']['en'])])->all();
    }

    /**
     * Label of a field or status for the admin panel.
     */
    public static function label(string $type, string $name): string
    {
        $field = collect(self::fields($type))->firstWhere('name', $name);

        return $field['label']['en'] ?? Str::headline($name);
    }
}
