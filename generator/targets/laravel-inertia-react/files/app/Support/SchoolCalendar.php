<?php

namespace App\Support;

use Carbon\CarbonImmutable;

/**
 * Builds the school's iCalendar (.ics) feed, with the same rules as runtime/ics.ts
 * in the SchoolForge generator: free-text times like "9 am - 1 pm" become timed
 * events, anything else an all-day event.
 */
class SchoolCalendar
{
    /**
     * @param  array<string, mixed>  $site
     * @param  list<array<string, mixed>>|null  $events
     */
    public static function ics(array $site, ?array $events = null): string
    {
        $host = parse_url((string) ($site['seo']['siteUrl'] ?? ''), PHP_URL_HOST) ?: 'school.local';
        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//SchoolForge//School Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:'.self::escape($site['school']['name'] ?? 'School'),
        ];

        foreach ($events ?? $site['content']['events'] ?? [] as $event) {
            array_push($lines, ...self::eventLines($event, $host));
        }

        $lines[] = 'END:VCALENDAR';

        return implode("\r\n", array_map(self::fold(...), $lines))."\r\n";
    }

    /**
     * @return array{start: array{0: int, 1: int}, end: array{0: int, 1: int}|null}|null
     */
    public static function parseTime(?string $value): ?array
    {
        if (blank($value)) {
            return null;
        }

        $parts = array_values(array_filter(preg_split('/\s*(?:-|–|—|\bto\b)\s*/iu', $value)));
        $start = self::parseClock($parts[0] ?? '');

        if ($start === null) {
            return null;
        }

        $end = isset($parts[1]) ? self::parseClock($parts[1]) : null;

        if ($end !== null && ! preg_match('/[ap]\.?m/i', $parts[0]) && preg_match('/p\.?m/i', $parts[1]) && $start[0] < 12 && $end[0] >= $start[0] + 12) {
            $start[0] += 12;
        }

        if ($end !== null && $end[0] * 60 + $end[1] <= $start[0] * 60 + $start[1]) {
            $end = null;
        }

        return ['start' => $start, 'end' => $end];
    }

    /**
     * @return array{0: int, 1: int}|null
     */
    private static function parseClock(string $value): ?array
    {
        if (! preg_match('/^(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?\s*(?:m\.?)?$/i', trim($value), $match)) {
            return null;
        }

        $hour = (int) $match[1];
        $minute = (int) ($match[2] ?? 0);
        $meridiem = strtolower($match[3] ?? '');

        if ($meridiem === 'p' && $hour < 12) {
            $hour += 12;
        } elseif ($meridiem === 'a' && $hour === 12) {
            $hour = 0;
        }

        return $hour < 24 && $minute < 60 ? [$hour, $minute] : null;
    }

    /**
     * @param  array<string, mixed>  $event
     * @return list<string>
     */
    private static function eventLines(array $event, string $host): array
    {
        $date = (string) $event['date'];
        $lastDay = filled($event['endDate'] ?? null) && $event['endDate'] > $date ? (string) $event['endDate'] : $date;
        $compact = fn (string $value): string => str_replace('-', '', $value);
        $time = self::parseTime($event['time'] ?? null);
        $lines = ['BEGIN:VEVENT', "UID:{$date}-".self::titleId((string) $event['title'])."@{$host}", 'DTSTAMP:'.$compact($date).'T000000Z'];

        if ($time !== null) {
            $end = $time['end'] ?? ($time['start'][0] >= 23 ? [23, 59] : [$time['start'][0] + 1, $time['start'][1]]);
            $lines[] = sprintf('DTSTART:%sT%02d%02d00', $compact($date), ...$time['start']);
            $lines[] = sprintf('DTEND:%sT%02d%02d00', $compact($lastDay), ...$end);
        } else {
            $lines[] = 'DTSTART;VALUE=DATE:'.$compact($date);
            $lines[] = 'DTEND;VALUE=DATE:'.CarbonImmutable::parse($lastDay)->addDay()->format('Ymd');
        }

        $lines[] = 'SUMMARY:'.self::escape((string) $event['title']);

        foreach (['description' => 'DESCRIPTION', 'location' => 'LOCATION', 'category' => 'CATEGORIES'] as $field => $property) {
            if (filled($event[$field] ?? null)) {
                $lines[] = $property.':'.self::escape((string) $event[$field]);
            }
        }

        $lines[] = 'END:VEVENT';

        return $lines;
    }

    private static function escape(string $value): string
    {
        return preg_replace('/\r?\n/', '\\n', str_replace(['\\', ';', ','], ['\\\\', '\\;', '\\,'], $value));
    }

    /**
     * Splits a line into 75-byte pieces without cutting a multi-byte character.
     */
    private static function fold(string $line): string
    {
        $pieces = [];
        $current = '';

        foreach (mb_str_split($line) as $character) {
            if (strlen($current) + strlen($character) > ($pieces === [] ? 75 : 74)) {
                $pieces[] = $current;
                $current = '';
            }

            $current .= $character;
        }

        $pieces[] = $current;

        return implode("\r\n ", $pieces);
    }

    /**
     * The title's slug, or a short hash for titles without Latin letters. Matches
     * the generator, so an event keeps its id whichever app serves the feed.
     */
    private static function titleId(string $title): string
    {
        $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($title)), '-');

        if ($slug !== '') {
            return $slug;
        }

        $hash = 5381;

        foreach (mb_str_split($title) as $character) {
            $hash = ($hash * 33 + mb_ord($character)) % 4294967296;
        }

        return 'event-'.base_convert((string) $hash, 10, 36);
    }
}
