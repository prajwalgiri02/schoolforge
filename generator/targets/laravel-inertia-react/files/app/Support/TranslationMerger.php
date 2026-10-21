<?php

namespace App\Support;

/**
 * Lays translated content over the default-language content, with the same rules
 * as mergeTranslation() in the SchoolForge generator: objects merge key by key,
 * lists of objects merge item by item (keeping images and untranslated items),
 * anything else is replaced when the translation has a value.
 */
class TranslationMerger
{
    public static function merge(mixed $base, mixed $overlay): mixed
    {
        $base = $base instanceof \stdClass ? (array) $base : $base;
        $overlay = $overlay instanceof \stdClass ? (array) $overlay : $overlay;

        if ($overlay === null || $overlay === '' || $overlay === []) {
            return $base;
        }

        if (self::isObject($base) && self::isObject($overlay)) {
            foreach ($overlay as $key => $value) {
                $base[$key] = self::merge($base[$key] ?? null, $value);
            }

            return $base;
        }

        if (is_array($base) && array_is_list($base) && is_array($overlay) && array_is_list($overlay) && self::hasObjects($base)) {
            $merged = [];

            foreach ($base as $index => $item) {
                $merged[] = self::merge($item, $overlay[$index] ?? null);
            }

            return [...$merged, ...array_slice($overlay, count($base))];
        }

        return $overlay;
    }

    /**
     * The parts of `$value` that differ from `$base`: what a translation must store
     * so untranslated fields keep following the default language.
     */
    public static function diff(mixed $base, mixed $value): mixed
    {
        $base = $base instanceof \stdClass ? (array) $base : $base;
        $value = $value instanceof \stdClass ? (array) $value : $value;

        if (self::isObject($base) && self::isObject($value)) {
            $diff = [];

            foreach ($value as $key => $item) {
                $changed = self::diff($base[$key] ?? null, $item);

                if ($changed !== null) {
                    $diff[$key] = $changed;
                }
            }

            return $diff === [] ? null : $diff;
        }

        if (is_array($base) && array_is_list($base) && is_array($value) && array_is_list($value) && self::hasObjects($base) && count($value) === count($base)) {
            $diff = array_map(fn (mixed $item, int $index): mixed => self::diff($base[$index], $item) ?? [], $value, array_keys($value));

            return array_filter($diff) === [] ? null : $diff;
        }

        return $value === $base ? null : $value;
    }

    private static function isObject(mixed $value): bool
    {
        return is_array($value) && ($value === [] || ! array_is_list($value));
    }

    /**
     * @param  array<int, mixed>  $list
     */
    private static function hasObjects(array $list): bool
    {
        foreach ($list as $item) {
            if (self::isObject($item)) {
                return true;
            }
        }

        return false;
    }
}
