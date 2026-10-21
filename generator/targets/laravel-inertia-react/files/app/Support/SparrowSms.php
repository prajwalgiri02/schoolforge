<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Sends text messages through Sparrow SMS (Nepal). Numbers go out in batches of
 * 100, the most one request accepts.
 */
class SparrowSms
{
    public static function configured(): bool
    {
        return filled(config('school.sms.token'));
    }

    /**
     * @param  list<string>  $numbers  10-digit Nepali mobile numbers
     * @return int how many numbers were accepted
     */
    public static function send(array $numbers, string $text): int
    {
        if (! self::configured()) {
            throw new RuntimeException('Sparrow SMS is not configured. Set SPARROW_SMS_TOKEN in .env.');
        }

        $sent = 0;

        foreach (array_chunk(array_values(array_unique($numbers)), 100) as $batch) {
            $response = Http::asForm()->timeout(30)->post(config('school.sms.endpoint'), [
                'token' => config('school.sms.token'),
                'from' => config('school.sms.from'),
                'to' => implode(',', $batch),
                'text' => $text,
            ]);

            if ($response->failed()) {
                throw new RuntimeException('Sparrow SMS refused the message: '.($response->json('response') ?? $response->body()));
            }

            $sent += count($batch);
        }

        return $sent;
    }
}
