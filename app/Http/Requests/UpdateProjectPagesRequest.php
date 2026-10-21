<?php

namespace App\Http\Requests;

use App\Services\Generator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProjectPagesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $components = array_column(app(Generator::class)->registry()['components'], 'name');

        return [
            'pages' => ['required', 'array', 'min:1', 'max:30'],
            'pages.*.slug' => ['required', 'string', 'max:80', 'regex:/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/', 'distinct'],
            'pages.*.title' => ['required', 'string', 'max:120'],
            'pages.*.navLabel' => ['nullable', 'string', 'max:40'],
            'pages.*.description' => ['nullable', 'string', 'max:300'],
            'pages.*.showInNav' => ['nullable', 'boolean'],
            'pages.*.sections' => ['present', 'array', 'max:40'],
            'pages.*.sections.*.type' => ['required', 'string', Rule::in($components)],
            'pages.*.sections.*.variant' => ['nullable', 'string', 'max:40'],
            'pages.*.sections.*.title' => ['nullable', 'string', 'max:200'],
            'pages.*.sections.*.subtitle' => ['nullable', 'string', 'max:500'],
            'pages.*.sections.*.eyebrow' => ['nullable', 'string', 'max:80'],
            'pages.*.sections.*.limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'pages.*.sections.*.paragraphs' => ['nullable', 'array', 'max:50'],
            'pages.*.sections.*.paragraphs.*' => ['string', 'max:5000'],
            'translations' => ['nullable', 'array'],
            'translations.*' => ['array'],
            'translations.*.*.title' => ['nullable', 'string', 'max:120'],
            'translations.*.*.navLabel' => ['nullable', 'string', 'max:40'],
            'translations.*.*.description' => ['nullable', 'string', 'max:300'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'pages.*.slug.regex' => 'Use a path like /about or /sports/football (lowercase letters, numbers and dashes).',
            'pages.*.slug.distinct' => 'Two pages use the same address.',
        ];
    }

    /**
     * Require a home page and check section variants exist.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $pages = $this->input('pages');

                if (! is_array($pages) || $validator->errors()->isNotEmpty()) {
                    return;
                }

                if (! collect($pages)->contains('slug', '/')) {
                    $validator->errors()->add('pages', 'The site needs a home page with the address “/”.');
                }

                $variants = collect(app(Generator::class)->registry()['components'])->pluck('variants', 'name');

                foreach ($pages as $pageIndex => $page) {
                    foreach ($page['sections'] ?? [] as $sectionIndex => $section) {
                        $variant = $section['variant'] ?? null;

                        if (filled($variant) && ! in_array($variant, $variants[$section['type']] ?? [], true)) {
                            $validator->errors()->add("pages.{$pageIndex}.sections.{$sectionIndex}.variant", "“{$variant}” is not a layout of {$section['type']}.");
                        }
                    }
                }
            },
        ];
    }

    /**
     * The submitted pages with empty optional values removed.
     *
     * @return list<array<string, mixed>>
     */
    public function pages(): array
    {
        $clean = fn (array $values): array => array_filter($values, fn ($value): bool => $value !== null && $value !== '' && $value !== []);

        return array_values(array_map(fn (array $page): array => [
            ...$clean(collect($page)->except('sections')->all()),
            'showInNav' => (bool) ($page['showInNav'] ?? true),
            'sections' => array_values(array_map($clean, $page['sections'] ?? [])),
        ], $this->input('pages')));
    }

    /**
     * Translated page titles for each of the given languages, keyed by page address.
     * Pages that no longer exist and empty values are dropped.
     *
     * @param  list<string>  $locales
     * @return array<string, array<string, array{title?: string, navLabel?: string, description?: string}>>
     */
    public function pageTranslations(array $locales): array
    {
        $slugs = array_column($this->input('pages'), 'slug');
        $translations = [];

        foreach ($locales as $locale) {
            foreach ((array) $this->input("translations.{$locale}", []) as $slug => $values) {
                $values = array_filter(array_intersect_key((array) $values, array_flip(['title', 'navLabel', 'description'])), fn ($value): bool => filled($value));

                if (in_array($slug, $slugs, true) && $values !== []) {
                    $translations[$locale][$slug] = $values;
                }
            }
        }

        return $translations;
    }
}
