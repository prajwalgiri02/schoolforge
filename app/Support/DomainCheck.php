<?php

namespace App\Support;

use App\Models\Project;
use Closure;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Checks that a school's domain points at this Studio server and answers over
 * HTTPS, so the Publish tab can say what is left to set up.
 */
class DomainCheck
{
    /**
     * Resolves a host name to its IP addresses. Replaceable in tests.
     *
     * @var (Closure(string): list<string>)|null
     */
    public static ?Closure $resolver = null;

    /**
     * @return array{host: string, addresses: list<string>, pointsHere: bool}[]
     */
    public static function dns(Project $project): array
    {
        $serverAddresses = static::serverAddresses();

        return collect([$project->domain, 'www.'.$project->domain])->map(function (string $host) use ($serverAddresses): array {
            $addresses = static::resolve($host);

            return ['host' => $host, 'addresses' => $addresses, 'pointsHere' => $addresses !== [] && array_diff($addresses, $serverAddresses) === []];
        })->all();
    }

    /**
     * Whether the school's site answers over HTTPS with a valid certificate.
     */
    public static function https(Project $project): bool
    {
        try {
            $response = Http::timeout(8)->connectTimeout(5)->get("https://{$project->domain}/robots.txt");
        } catch (ConnectionException) {
            return false;
        }

        return $response->successful() && str_contains($response->body(), 'Sitemap:');
    }

    /**
     * @return array{records: array{host: string, addresses: list<string>, pointsHere: bool}[], serverAddresses: list<string>, https: bool, checkedAt: string}
     */
    public static function run(Project $project): array
    {
        return [
            'records' => static::dns($project),
            'serverAddresses' => static::serverAddresses(),
            'https' => static::https($project),
            'checkedAt' => now()->toIso8601String(),
        ];
    }

    /**
     * This server's public addresses: SCHOOLFORGE_SERVER_IPS, else those of Studio's own host.
     *
     * @return list<string>
     */
    public static function serverAddresses(): array
    {
        $configured = array_values(array_filter(array_map('trim', explode(',', (string) config('studio.server_ips')))));

        return $configured !== [] ? $configured : static::resolve(HostedSites::studioHost());
    }

    /**
     * @return list<string>
     */
    protected static function resolve(string $host): array
    {
        if (static::$resolver) {
            return (static::$resolver)($host);
        }

        $records = @dns_get_record($host, DNS_A | DNS_AAAA) ?: [];

        return array_values(array_unique(array_filter(array_map(fn (array $record): ?string => $record['ip'] ?? $record['ipv6'] ?? null, $records))));
    }
}
