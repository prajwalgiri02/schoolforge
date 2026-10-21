<?php

namespace App\Support;

/**
 * Things worth fixing before a school website goes live, beyond what the
 * generator rejects: missing contact details and images, broken internal
 * links, past dates, untranslated content and features the target lacks.
 */
class ProjectChecks
{
    /**
     * @param  array<string, mixed>  $config
     * @param  array<string, mixed>|null  $site  Site data from the generator preview, when the config is valid.
     * @return list<array{level: 'warning'|'tip', message: string, section: string|null}>
     */
    public static function run(array $config, ?array $site): array
    {
        $checks = [];
        $add = function (string $level, string $message, ?string $section = null) use (&$checks): void {
            $checks[] = ['level' => $level, 'message' => $message, 'section' => $section];
        };
        $today = now()->toDateString();
        $contact = $config['school']['contact'] ?? [];
        $target = $config['target'] ?? 'nextjs';

        if (blank($config['school']['logo'] ?? null)) {
            $add('tip', 'Add the school logo so it shows in the menu, footer and search results.', 'school');
        }

        if (blank($contact['phone'] ?? null) && blank($contact['email'] ?? null)) {
            $add('warning', 'Add a phone number or email address so families can reach the school.', 'contact');
        }

        if (blank($contact['address'] ?? null)) {
            $add('tip', 'Add the school’s address for the contact page and Google.', 'contact');
        }

        if (blank($config['seo']['siteUrl'] ?? null)) {
            $add('warning', 'Set the live website address (SEO → Site URL) so the sitemap, share previews and canonical links are correct.', 'seo');
        }

        if (isset($config['hero']) && blank($config['hero']['image'] ?? null)) {
            $add('tip', 'Add a photo to the home page banner.', 'hero');
        }

        foreach (['gallery' => ['src', 'photos in the gallery'], 'faculty' => ['photo', 'faculty members'], 'news' => ['image', 'news stories']] as $key => [$field, $label]) {
            $missing = collect($config[$key] ?? [])->filter(fn ($item): bool => is_array($item) && blank($item[$field] ?? null))->count();

            if ($missing > 0) {
                $add('tip', "{$missing} {$label} have no ".($field === 'src' ? 'image file' : $field).' yet.', $key);
            }
        }

        $pastEvents = collect($config['events'] ?? [])->filter(fn ($event): bool => ($event['endDate'] ?? $event['date'] ?? $today) < $today)->count();

        if ($pastEvents > 0) {
            $add('tip', "{$pastEvents} ".str('event')->plural($pastEvents).' already happened. Remove them or keep them as a record.', 'events');
        }

        if (($config['admissions']['open'] ?? false) && filled($config['admissions']['deadline'] ?? null) && $config['admissions']['deadline'] < $today) {
            $add('warning', 'Admissions are marked open but the deadline has passed.', 'admissions');
        }

        if (filled($config['popup']['endDate'] ?? null) && $config['popup']['endDate'] < $today) {
            $add('tip', 'The popup announcement has ended; clear it to tidy up.', 'popup');
        }

        if ($site !== null) {
            $slugs = collect($site['pages'])->pluck('slug');
            $links = collect([
                ...array_column($config['navigation'] ?? [], 'href'),
                $config['hero']['primaryCta']['href'] ?? null,
                $config['hero']['secondaryCta']['href'] ?? null,
                $config['announcement']['link']['href'] ?? null,
                $config['popup']['link']['href'] ?? null,
            ])->filter(fn ($href): bool => is_string($href) && str_starts_with($href, '/') && ! str_starts_with($href, '//'));

            foreach ($links->unique() as $href) {
                $path = strtok($href, '?#') ?: '/';

                if (! $slugs->contains(rtrim($path, '/') ?: '/') && ! preg_match('#^/(storage|files|images)/#', $path)) {
                    $add('warning', "A link points to {$href}, but the site has no page there.", null);
                }
            }
        }

        foreach (array_slice($config['languages'] ?? [], 1) as $locale) {
            $translated = array_keys(array_filter($config['translations'][$locale] ?? []));
            $untranslated = collect(['hero', 'about', 'programs', 'news', 'admissions'])->filter(fn (string $key): bool => isset($config[$key]) && ! in_array($key, $translated, true));

            if ($untranslated->isNotEmpty()) {
                $add('tip', strtoupper($locale).' version: '.$untranslated->join(', ', ' and ').' still show in the default language.', $untranslated->first());
            }
        }

        if ($target === 'nextjs' && (filled($config['jobs'] ?? null) || ($config['admissions']['open'] ?? false))) {
            $add('tip', 'On Next.js, set FORMS_WEBHOOK_URL when deploying so online applications reach the school (see DEPLOY.md).', null);
        }

        return $checks;
    }
}
