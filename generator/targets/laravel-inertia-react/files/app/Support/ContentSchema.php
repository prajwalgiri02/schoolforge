<?php

namespace App\Support;

use Closure;
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
                self::field('whatsapp', 'text', 'WhatsApp number', help: 'With country code, e.g. +977 9801234567. Shows a chat button on every page.'),
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
            'seo' => self::section('Search & sharing', 'How the site appears on Google and when shared on Facebook or WhatsApp.', 'object', 'seo', [
                self::field('siteUrl', 'text', 'Website address', help: 'The live address, e.g. https://www.myschool.edu.np. Used for the sitemap and share links.'),
                self::field('image', 'image', 'Share image', help: 'Shown in link previews. Defaults to the home page banner or logo.'),
                self::field('keywords', 'strings', 'Keywords', help: 'One per line, e.g. "school in Kathmandu".'),
                self::field('googleSiteVerification', 'text', 'Google Search Console code'),
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
            'popup' => self::section('Popup announcement', 'A popup shown once to each visitor, e.g. for admissions or closures. Clear the title and message to turn it off.', 'object', 'content.popup', [
                self::field('title', 'text', 'Title'),
                self::field('message', 'textarea', 'Message'),
                self::field('image', 'image', 'Image'),
                $link('link', 'Button'),
                self::field('startDate', 'date', 'Show from', help: 'Leave empty to start now.'),
                self::field('endDate', 'date', 'Show until', help: 'Leave empty to keep showing it.'),
                self::field('everyVisit', 'boolean', 'Show on every visit', help: 'Otherwise each visitor sees it once.'),
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
            'albums' => self::section('Photo albums', 'Albums of photos, each with its own page under /gallery.', 'list', 'content.albums', [
                self::field('title', 'text', 'Title', required: true),
                self::field('date', 'date', 'Date'),
                self::field('description', 'textarea', 'Description'),
                self::field('cover', 'image', 'Cover photo', help: 'Leave empty to use the first photo.'),
                self::field('photos', 'items', 'Photos', fields: [
                    self::field('src', 'image', 'Photo'),
                    self::field('caption', 'text', 'Caption'),
                ]),
                self::field('slug', 'text', 'URL slug', help: 'Leave empty to create it from the title.'),
            ], 'title'),
            'videos' => self::section('Videos', 'YouTube or Vimeo videos.', 'list', 'content.videos', [
                self::field('title', 'text', 'Title', required: true),
                self::field('url', 'url', 'Video link', required: true, help: 'e.g. https://www.youtube.com/watch?v=… or https://vimeo.com/…'),
                self::field('date', 'date', 'Date'),
                self::field('description', 'textarea', 'Description'),
                self::field('thumbnail', 'image', 'Thumbnail', help: 'Optional. YouTube videos get one automatically.'),
            ], 'title'),
            'campuses' => self::section('Campuses', 'Branches of the school. With two or more, visitors can pick a campus on the contact form.', 'list', 'content.campuses', [
                self::field('name', 'text', 'Campus name', required: true),
                self::field('address', 'text', 'Address'),
                self::field('phone', 'text', 'Phone'),
                self::field('email', 'text', 'Email'),
                self::field('hours', 'text', 'Office hours'),
                self::field('levels', 'strings', 'Levels offered', help: 'One per line, e.g. Pre-primary, Grades 1–10'),
                self::field('description', 'textarea', 'Description'),
                self::field('image', 'image', 'Photo'),
                self::field('mapUrl', 'url', 'Map link', help: 'Optional. Defaults to a Google Maps search for the address.'),
            ], 'name'),
            'jobs' => self::section('Careers', 'Job openings. Applicants apply on the Careers page and appear under Applications.', 'list', 'content.jobs', [
                self::field('title', 'text', 'Position', required: true),
                self::field('type', 'text', 'Type', help: 'e.g. Full-time, Part-time'),
                self::field('location', 'text', 'Location'),
                self::field('deadline', 'date', 'Apply by'),
                self::field('description', 'textarea', 'Description'),
                self::field('requirements', 'strings', 'Requirements', help: 'One per line.'),
            ], 'title'),
            'downloads' => self::section('Downloads', 'Forms, prospectus, calendars and other files.', 'list', 'content.downloads', [
                self::field('title', 'text', 'Title', required: true),
                self::field('file', 'file', 'File', required: true, help: 'PDF, Word, Excel or PowerPoint, up to 10 MB.'),
                self::field('category', 'text', 'Category', help: 'e.g. Admission forms, Academic calendar'),
                self::field('date', 'date', 'Date'),
                self::field('description', 'text', 'Short description'),
            ], 'title'),
            'alumni' => self::section('Alumni', 'Alumni profiles. Approved alumni registrations are added here automatically.', 'list', 'content.alumni', [
                self::field('name', 'text', 'Name', required: true),
                self::field('batch', 'text', 'Batch (year)'),
                self::field('role', 'text', 'What they do now'),
                self::field('photo', 'image', 'Photo'),
                self::field('quote', 'textarea', 'Message'),
            ], 'name'),
            'news' => self::section('News', 'News stories. Stories with a full text get their own page.', 'list', 'content.news', [
                self::field('title', 'text', 'Title', required: true),
                self::field('date', 'date', 'Date'),
                self::field('excerpt', 'textarea', 'Excerpt'),
                self::field('image', 'image', 'Image'),
                self::field('category', 'text', 'Category', help: 'e.g. Sports, Academics, Announcements'),
                self::field('tags', 'strings', 'Tags', help: 'One per line. Visitors can filter news by tag.'),
                self::field('body', 'paragraphs', 'Full text', help: 'Separate paragraphs with a blank line.'),
                self::field('slug', 'text', 'URL slug', help: 'Leave empty to create it from the title.'),
            ], 'title'),
            'events' => self::section('Events', 'Upcoming events calendar.', 'list', 'content.events', [
                self::field('title', 'text', 'Title', required: true),
                self::field('date', 'date', 'Date', required: true),
                self::field('endDate', 'date', 'End date', help: 'For events that last several days'),
                self::field('time', 'text', 'Time', help: 'e.g. 9 am - 1 pm (leave empty for all-day events)'),
                self::field('location', 'text', 'Location'),
                self::field('category', 'text', 'Category', help: 'e.g. Sports, Exams, Holiday'),
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
     * @return array<string, list<string|Closure>>
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
     * and fills in news and album slugs so their URLs stay stable.
     */
    public static function normalize(string $key, mixed $value): mixed
    {
        $section = self::find($key);
        $value = self::clean($value) ?? [];

        if ($section['kind'] === 'list') {
            $value = array_values(array_filter($value, fn ($item): bool => is_array($item) && $item !== []));
        }

        if (in_array($key, ['news', 'albums'], true)) {
            $noun = $key === 'news' ? 'article' : 'album';
            $value = array_map(
                fn (array $item, int $index): array => [...$item, 'slug' => Str::slug($item['slug'] ?? $item['title']) ?: "{$noun}-".($index + 1)],
                $value,
                array_keys($value),
            );
        }

        if ($key === 'school' && isset($value['established']) && ctype_digit((string) $value['established'])) {
            $value['established'] = (int) $value['established'];
        }

        return $value;
    }

    /**
     * First steps that make a new website the school's own, each done once its content is filled in.
     *
     * @param  array<string, mixed>  $site
     * @return list<array{key: string, label: string, section: string, done: bool}>
     */
    public static function checklist(array $site, bool $configShape = false): array
    {
        $value = fn (string $key): array => (array) self::valueFrom($site, $key, $configShape);
        $contact = $value('contact');

        return [
            ['key' => 'logo', 'label' => 'Add the school’s logo', 'section' => 'school', 'done' => filled($value('school')['logo'] ?? null)],
            ['key' => 'contact', 'label' => 'Fill in the address, phone and email', 'section' => 'contact', 'done' => filled($contact['address'] ?? null) && (filled($contact['phone'] ?? null) || filled($contact['email'] ?? null))],
            ['key' => 'about', 'label' => 'Introduce the school', 'section' => 'about', 'done' => filled($value('about')['summary'] ?? null)],
            ['key' => 'principal', 'label' => 'Add the principal’s message', 'section' => 'principal', 'done' => filled($value('principal')['message'] ?? null)],
            ['key' => 'news', 'label' => 'Post the first news story', 'section' => 'news', 'done' => $value('news') !== []],
            ['key' => 'gallery', 'label' => 'Add photos to the gallery', 'section' => 'gallery', 'done' => $value('gallery') !== []],
        ];
    }

    /**
     * How much the website has: its pages and the lists visitors browse most.
     *
     * @param  array<string, mixed>  $site
     * @return list<array{key: string, label: string, value: int}>
     */
    public static function summary(array $site, int $pageCount, bool $configShape = false): array
    {
        $count = fn (string $key): int => count((array) self::valueFrom($site, $key, $configShape));

        return [
            ['key' => 'pages', 'label' => 'Pages', 'value' => $pageCount],
            ['key' => 'news', 'label' => 'News stories', 'value' => $count('news')],
            ['key' => 'events', 'label' => 'Events', 'value' => $count('events')],
            ['key' => 'notices', 'label' => 'Notices', 'value' => $count('notices')],
            ['key' => 'gallery', 'label' => 'Gallery photos', 'value' => $count('gallery')],
        ];
    }

    /**
     * Reads the value a section currently has in the site data (or, with
     * `$configShape`, in a school config where content blocks are top-level).
     */
    public static function valueFrom(array $site, string $key, bool $configShape = false): mixed
    {
        $section = self::find($key);
        $value = Arr::get($site, self::targetPath($section, $configShape));

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
        $target = self::targetPath($section, $configShape);

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
     * @param  array{target: string}  $section
     */
    private static function targetPath(array $section, bool $configShape): string
    {
        return $configShape ? Str::after($section['target'], 'content.') : $section['target'];
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     * @return array<string, list<string|Closure>>
     */
    private static function fieldRules(array $fields, string $prefix): array
    {
        $rules = [];

        foreach ($fields as $field) {
            $path = "{$prefix}.{$field['name']}";
            $presence = $field['required'] ? 'required' : 'nullable';

            match ($field['type']) {
                // Configs may hold numbers in text fields, such as the year established.
                'text' => $rules[$path] = [$presence, self::textOrNumber(...), 'max:255'],
                'icon' => $rules[$path] = [$presence, 'string', 'max:255'],
                'textarea' => $rules[$path] = [$presence, 'string', 'max:5000'],
                'url', 'image', 'file' => $rules[$path] = [$presence, 'string', 'max:500'],
                'date' => $rules[$path] = [$presence, 'date_format:Y-m-d'],
                'boolean' => $rules[$path] = ['nullable', 'boolean'],
                'strings', 'paragraphs' => $rules += [$path => [$presence, 'array', 'max:100'], "{$path}.*" => ['nullable', 'string', 'max:5000']],
                'link' => $rules += [$path => ['nullable', 'array'], "{$path}.label" => ["required_with:{$path}.href", 'nullable', 'string', 'max:120'], "{$path}.href" => ["required_with:{$path}.label", 'nullable', 'string', 'max:500']],
                'items' => $rules += [$path => ['nullable', 'array', 'max:200'], ...self::fieldRules($field['fields'], "{$path}.*")],
            };
        }

        return $rules;
    }

    private static function textOrNumber(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) && ! is_int($value) && ! is_float($value)) {
            $fail('The :attribute field must be text.');
        }
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
