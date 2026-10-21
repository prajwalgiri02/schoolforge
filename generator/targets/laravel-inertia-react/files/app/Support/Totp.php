<?php

namespace App\Support;

/**
 * Time-based one-time passwords (RFC 6238) as used by Google Authenticator,
 * Microsoft Authenticator, Authy and similar apps: 6 digits, 30-second steps,
 * SHA-1, with a base32 secret.
 */
class Totp
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public static function newSecret(): string
    {
        $secret = '';

        for ($index = 0; $index < 32; $index++) {
            $secret .= self::ALPHABET[random_int(0, 31)];
        }

        return $secret;
    }

    /**
     * The link authenticator apps read (also shown as a QR code by most password managers).
     */
    public static function uri(string $secret, string $account, string $issuer): string
    {
        return 'otpauth://totp/'.rawurlencode("{$issuer}:{$account}").'?'.http_build_query(['secret' => $secret, 'issuer' => $issuer, 'digits' => 6, 'period' => 30]);
    }

    public static function code(string $secret, ?int $timestamp = null): string
    {
        $counter = intdiv($timestamp ?? time(), 30);
        $hash = hash_hmac('sha1', pack('N2', 0, $counter), self::decode($secret), true);
        $offset = ord($hash[19]) & 0x0F;
        $value = ((ord($hash[$offset]) & 0x7F) << 24) | (ord($hash[$offset + 1]) << 16) | (ord($hash[$offset + 2]) << 8) | ord($hash[$offset + 3]);

        return str_pad((string) ($value % 1_000_000), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Accepts the current code and the ones either side of it, for clock drift.
     */
    public static function verify(string $secret, string $code, ?int $timestamp = null): bool
    {
        $code = preg_replace('/\s+/', '', $code);
        $timestamp ??= time();

        foreach ([-30, 0, 30] as $drift) {
            if (hash_equals(self::code($secret, $timestamp + $drift), $code)) {
                return true;
            }
        }

        return false;
    }

    private static function decode(string $secret): string
    {
        $bits = '';

        foreach (str_split(strtoupper($secret)) as $character) {
            $bits .= str_pad(decbin(strpos(self::ALPHABET, $character)), 5, '0', STR_PAD_LEFT);
        }

        return implode('', array_map(fn (string $byte): string => chr(bindec($byte)), array_filter(str_split($bits, 8), fn (string $byte): bool => strlen($byte) === 8)));
    }
}
