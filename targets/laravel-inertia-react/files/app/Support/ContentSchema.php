<?php

namespace App\Support;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * Describes every block of school content that can be edited in the admin panel.
 * The same definition drives the admin forms, validation, and how saved content
 * is merged into the generated site data.
 */
class ContentSchema
{
    /**
     * @return array<string, array{label: string, description: string, kind: 'object'|'list', target: string, fields: list<array<string, mixed>>, itemLabel?: string}>
     */
    public static function sections(): array
    {
        $link = fn (string $name, string $label): array => self::field($name, 'link', $label);

        return [
            'school' => self::section('School profile', 'Name, tagline, logo and other basic details.', 'object', 'school', [
                self::field('name', 'text', 'School name', required: true),
                self::field('shortName', 'text', 'Short name'),
                self::field('tagline', 'text', 'Tagline'),
                self::field('motto', 'text', 'Motto'),
                self::field('type', 'text', 'Type of school', help: 'e.g. Co-educational K–12 School'),
                self::field('established', 'text', 'Year established'),
                self::field('affiliation', 'text', 'Affiliation'),
                self::field('logo', 'image', 'Logo'),
                self::field('favicon', 'image', 'Favicon'),
            ]),
            'about' => self::section('About the school', 'Introduction, history, mission, vision and values.', 'object', 'school.about', [
                self::field('summary', 'textarea', 'Summary'),
                self::field('body', 'paragraphs', 'Full story', help: 'Separate paragraphs with a blank line.'),
                self::field('image', 'image', 'Image'),
                self::field('mission', 'textarea', 'Mission'),
                self::field('vision', 'textarea', 'Vision'),
                self::field('values', 'items', 'Core values', fields: [
                    self::field('title', 'text', 'Value', required: true),
                    self::field('description', 'text', 'Description'),
                ]),
            ]),
            'principal' => self::section("Principal's message", 'Welcome message from the head of school.', 'object', 'school.principal', [
                self::field('name', 'text', 'Name', required: true),
                self::field('title', 'text', 'Title'),
                self::field('photo', 'image', 'Photo'),
                self::field('message', 'paragraphs', 'Message', help: 'Separate paragraphs with a blank line.'),
            ]),
            'contact' => self::section('Contact details', 'Address, phone numbers, emails, hours and map.', 'object', 'school.contact', [
                self::field('address', 'text', 'Address'),
                self::field('phone', 'strings', 'Phone numbers', help: 'One per line.'),
                self::field('email', 'strings', 'Email addresses', help: 'One per line.'),
                self::field('hours', 'text', 'Office hours'),
                self::field('mapEmbedUrl', 'url', 'Map embed URL', help: 'From Google Maps "Share → Embed a map" or OpenStreetMap.'),
            ]),
            'social' => self::section('Social media', 'Links to the school’s social profiles.', 'object', 'school.social', [
                self::field('facebook', 'url', 'Facebook'),
                self::field('instagram', 'url', 'Instagram'),
                self::field('youtube', 'url', 'YouTube'),
                self::field('x', 'url', 'X (Twitter)'),
                self::field('linkedin', 'url', 'LinkedIn'),
                self::field('tiktok', 'url', 'TikTok'),
            ]),
            'hero' => self::section('Home page banner', 'The large banner at the top of the home page.', 'object', 'content.hero', [
                self::field('title', 'text', 'Headline'),
                self::field('subtitle', 'textarea', 'Subtitle'),
                self::field('image', 'image', 'Background image'),
                $link('primaryCta', 'Primary button'),
                $link('secondaryCta', 'Secondary button'),
            ]),
            'announcement' => self::section('Announcement bar', 'Short message shown above the menu. Clear the text to hide it.', 'object', 'content.announcement', [
                self::field('text', 'text', 'Message'),
                $link('link', 'Link'),
            ]),
            'admissions' => self::section('Admissions', 'Steps, required documents and deadline.', 'object', 'content.admissions', [
                self::field('open', 'boolean', 'Admissions are open'),
                self::field('intro', 'textarea', 'Introduction'),
                self::field('deadline', 'date', 'Application deadline'),
                self::field('steps', 'items', 'Steps', fields: [
                    self::field('title', 'text', 'Step', required: true),
                    self::field('description', 'text', 'Description'),
                ]),
                self::field('requirements', 'strings', 'Documents required', help: 'One per line.'),
                $link('cta', 'Apply button'),
                self::field('feeStructureUrl', 'url', 'Fee structure link'),
            ]),
            'stats' => self::section('Statistics', 'Key numbers shown on the home page.', 'list', 'content.stats', [
                self::field('value', 'text', 'Value', required: true, help: 'e.g. 1,200+'),
                self::field('label', 'text', 'Label', required: true),
            ], 'label'),
            'programs' => self::section('Programs', 'Academic programs and levels.', 'list', 'content.programs', [
                self::field('name', 'text', 'Name', required: true),
                self::field('level', 'text', 'Level', help: 'e.g. Grades 1 – 5'),
                self::field('description', 'textarea', 'Description'),
                self::field('image', 'image', 'Image'),
                self::field('highlights', 'strings', 'Highlights', help: 'One per line.'),
            ], 'name'),
            'facilities' => self::section('Facilities', 'Campus facilities.', 'list', 'content.facilities', [
                self::field('name', 'text', 'Name', required: true),
                self::field('description', 'textarea', 'Description'),
                self::field('icon', 'icon', 'Icon'),
                self::field('image', 'image', 'Image'),
            ], 'name'),
            'faculty' => self::section('Faculty & staff', 'Teachers and staff directory.', 'list', 'content.faculty', [
                self::field('name', 'text', 'Name', required: true),
                self::field('role', 'text', 'Role'),
                self::field('department', 'text', 'Department'),
                self::field('photo', 'image', 'Photo'),
                self::field('bio', 'textarea', 'Short bio'),
            ], 'name'),
            'gallery' => self::section('Gallery', 'Photos shown in the gallery.', 'list', 'content.gallery', [
                self::field('src', 'image', 'Photo'),
                self::field('caption', 'text', 'Caption'),
                self::field('category', 'text', 'Category', help: 'Used for the gallery filter.'),
            ], 'caption'),
            'news' => self::section('News', 'News stories. Stories with a full text get their own page.', 'list', 'content.news', [
                self::field('title', 'text', 'Title', required: true),
                self::field('date', 'date', 'Date'),
                self::field('excerpt', 'textarea', 'Excerpt'),
                self::field('image', 'image', 'Image'),
                self::field('body', 'paragraphs', 'Full text', help: 'Separate paragraphs with a blank line.'),
                self::field('slug', 'text', 'URL slug', help: 'Leave empty to create it from the title.'),
            ], 'title'),
            'events' => self::section('Events', 'Upcoming events calendar.', 'list', 'content.events', [
                self::field('title', 'text', 'Title', required: true),
                self::field('date', 'date', 'Date', required: true),
                self::field('time', 'text', 'Time'),
                self::field('location', 'text', 'Location'),
                self::field('description', 'textarea', 'Description'),
            ], 'title'),
            'notices' => self::section('Notices', 'Notice board and circulars.', 'list', 'content.notices', [
                self::field('title', 'text', 'Title', required: true),
                self::field('date', 'date', 'Date'),
                self::field('link', 'url', 'Link or file URL'),
                self::field('important', 'boolean', 'Mark as important'),
            ], 'title'),
            'testimonials' => self::section('Testimonials', 'Quotes from parents, students and alumni.', 'list', 'content.testimonials', [
                self::field('quote', 'textarea', 'Quote', required: true),
                self::field('name', 'text', 'Name', required: true),
                self::field('role', 'text', 'Role', help: 'e.g. Parent, Grade 4'),
                self::field('photo', 'image', 'Photo'),
            ], 'name'),
            'achievements' => self::section('Achievements', 'Awards and milestones.', 'list', 'content.achievements', [
                self::field('title', 'text', 'Title', required: true),
                self::field('year', 'text', 'Year'),
                self::field('description', 'textarea', 'Description'),
            ], 'title'),
            'faqs' => self::section('FAQs', 'Frequently asked questions.', 'list', 'content.faqs', [
                self::field('question', 'text', 'Question', required: true),
                self::field('answer', 'textarea', 'Answer', required: true),
            ], 'question'),
        ];
    }

    /**
     * @return array{label: string, description: string, kind: 'object'|'list', target: string, fields: list<array<string, mixed>>, itemLabel?: string}|null
     */
    public static function find(string $key): ?array
    {
        return self::sections()[$key] ?? null;
    }

    /**
     * Builds Laravel validation rules for a section's submitted `value`.
     *
     * @return array<string, list<string>>
     */
    public static function rules(string $key): array
    {
        $section = self::find($key);

        if ($section['kind'] === 'list') {
            return ['value' => ['present', 'array', 'max:200'], ...self::fieldRules($section['fields'], 'value.*')];
        }

        return ['value' => ['present', 'array'], ...self::fieldRules($section['fields'], 'value')];
    }

    /**
     * Human readable attribute names, so errors read "Title is required" instead of "value.0.title".
     *
     * @return array<string, string>
     */
    public static function attributes(string $key): array
    {
        $section = self::find($key);
        $prefix = $section['kind'] === 'list' ? 'value.*' : 'value';
        $attributes = [];

        foreach ($section['fields'] as $field) {
            $attributes["{$prefix}.{$field['name']}"] = Str::lower($field['label']);

            foreach ($field['fields'] ?? [] as $child) {
                $attributes["{$prefix}.{$field['name']}.*.{$child['name']}"] = Str::lower($child['label']);
            }
        }

        return $attributes;
    }

    /**
     * Removes empty values so stored content mirrors a hand-written school config,
     * and fills in news slugs so article URLs stay stable.
     */
    public static function normalize(string $key, mixed $value): mixed
    {
        $section = self::find($key);
        $value = self::clean($value) ?? [];

        if ($section['kind'] === 'list') {
            $value = array_values(array_filter($value, fn ($item): bool => is_array($item) && $item !== []));
        }

        if ($key === 'news') {
            $value = array_map(fn (array $item): array => [...$item, 'slug' => Str::slug($item['slug'] ?? $item['title'])], $value);
        }

        if ($key === 'school' && isset($value['established']) && ctype_digit((string) $value['established'])) {
            $value['established'] = (int) $value['established'];
        }

        return $value;
    }

    /**
     * Reads the value a section currently has in the site data.
     */
    public static function valueFrom(array $site, string $key): mixed
    {
        $section = self::find($key);
        $value = Arr::get($site, $section['target']);

        if ($key === 'school') {
            $editable = array_column($section['fields'], 'name');

            return Arr::only($value ?? [], $editable);
        }

        return $value ?? ($section['kind'] === 'list' ? [] : (object) []);
    }

    /**
     * Writes a section value into site data (or a school config, which shares the same shape
     * except that content blocks live at the top level instead of under `content`).
     *
     * @param  array<string, mixed>  $site
     * @return array<string, mixed>
     */
    public static function apply(array $site, string $key, mixed $value, bool $configShape = false): array
    {
        $section = self::find($key);
        $target = $configShape ? Str::after($section['target'], 'content.') : $section['target'];

        if ($key === 'school') {
            $cleared = array_diff(array_column($section['fields'], 'name'), array_keys($value));
            $site['school'] = array_replace(Arr::except($site['school'] ?? [], $cleared), $value);

            return $site;
        }

        if ($value === [] || $value === null) {
            Arr::forget($site, $target);
        } else {
            Arr::set($site, $target, $value);
        }

        return $site;
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     * @return array<string, list<string>>
     */
    private static function fieldRules(array $fields, string $prefix): array
    {
        $rules = [];

        foreach ($fields as $field) {
            $path = "{$prefix}.{$field['name']}";
            $presence = $field['required'] ? 'required' : 'nullable';

            match ($field['type']) {
                'text', 'icon' => $rules[$path] = [$presence, 'string', 'max:255'],
                'textarea' => $rules[$path] = [$presence, 'string', 'max:5000'],
                'url', 'image' => $rules[$path] = [$presence, 'string', 'max:500'],
                'date' => $rules[$path] = [$presence, 'date_format:Y-m-d'],
                'boolean' => $rules[$path] = ['nullable', 'boolean'],
                'strings', 'paragraphs' => $rules += [$path => [$presence, 'array', 'max:100'], "{$path}.*" => ['nullable', 'string', 'max:5000']],
                'link' => $rules += [$path => ['nullable', 'array'], "{$path}.label" => ["required_with:{$path}.href", 'nullable', 'string', 'max:120'], "{$path}.href" => ["required_with:{$path}.label", 'nullable', 'string', 'max:500']],
                'items' => $rules += [$path => ['nullable', 'array', 'max:50'], ...self::fieldRules($field['fields'], "{$path}.*")],
            };
        }

        return $rules;
    }

    private static function clean(mixed $value): mixed
    {
        if (is_string($value)) {
            $value = trim($value);

            return $value === '' ? null : $value;
        }

        if (! is_array($value)) {
            return $value;
        }

        $cleaned = [];

        foreach ($value as $key => $item) {
            $item = self::clean($item);

            if ($item !== null && $item !== []) {
                $cleaned[$key] = $item;
            }
        }

        return array_is_list($value) ? array_values($cleaned) : $cleaned;
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     * @return array{label: string, description: string, kind: 'object'|'list', target: string, fields: list<array<string, mixed>>, itemLabel?: string}
     */
    private static function section(string $label, string $description, string $kind, string $target, array $fields, ?string $itemLabel = null): array
    {
        return array_filter(compact('label', 'description', 'kind', 'target', 'fields', 'itemLabel'), fn ($value): bool => $value !== null);
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     * @return array<string, mixed>
     */
    private static function field(string $name, string $type, string $label, bool $required = false, ?string $help = null, array $fields = []): array
    {
        return array_filter(compact('name', 'type', 'label', 'required', 'help', 'fields'), fn ($value): bool => $value !== null && $value !== []) + ['required' => $required];
    }
}
