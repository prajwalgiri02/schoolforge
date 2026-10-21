<?php

namespace App\Support;

/**
 * Contrast helpers matching the SchoolForge generator's colour rules (WCAG 2 relative luminance).
 */
class Color
{
    public static function luminance(string $hex): float
    {
        $channels = array_map(function (string $pair): float {
            $value = hexdec($pair) / 255;

            return $value <= 0.03928 ? $value / 12.92 : (($value + 0.055) / 1.055) ** 2.4;
        }, str_split(ltrim($hex, '#'), 2));

        return 0.2126 * $channels[0] + 0.7152 * $channels[1] + 0.0722 * $channels[2];
    }

    public static function contrast(string $first, string $second): float
    {
        $values = [self::luminance($first), self::luminance($second)];

        return (max($values) + 0.05) / (min($values) + 0.05);
    }

    /**
     * Near-white or near-black text, whichever reads better on the colour.
     */
    public static function readableOn(string $hex): string
    {
        return self::contrast($hex, '#ffffff') >= self::contrast($hex, '#111827') ? '#ffffff' : '#111827';
    }

    /**
     * The colour, darkened just enough to reach the contrast ratio on the background.
     */
    public static function darkenUntilReadable(string $hex, string $background, float $ratio): string
    {
        [$red, $green, $blue] = array_map('hexdec', str_split(ltrim($hex, '#'), 2));

        for ($step = 0; $step < 20 && self::contrast(sprintf('#%02x%02x%02x', $red, $green, $blue), $background) < $ratio; $step++) {
            [$red, $green, $blue] = array_map(fn (int $channel): int => (int) round($channel * 0.9), [$red, $green, $blue]);
        }

        return sprintf('#%02x%02x%02x', $red, $green, $blue);
    }
}
