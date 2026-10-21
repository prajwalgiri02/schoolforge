<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Generator
    |--------------------------------------------------------------------------
    |
    | Studio drives the SchoolForge generator (a Node.js CLI) to validate
    | configs, render previews and write project codebases.
    |
    */

    'generator_path' => env('SCHOOLFORGE_GENERATOR_PATH', base_path('generator')),

    'node_binary' => env('SCHOOLFORGE_NODE_BINARY', 'node'),

    /*
    | Server bundle that renders published schools' pages to HTML, so search
    | engines can read hosted sites. Built by `npm run build`.
    */

    'ssr_bundle' => env('SCHOOLFORGE_SSR_BUNDLE', base_path('bootstrap/ssr/ssr.js')),

    /*
    |--------------------------------------------------------------------------
    | Output
    |--------------------------------------------------------------------------
    |
    | Default folder for generated school projects. Each project can choose
    | any other empty folder when generating.
    |
    */

    'output_path' => env('SCHOOLFORGE_OUTPUT_PATH', storage_path('app/generated')),

    /*
    |--------------------------------------------------------------------------
    | Generation Timeout
    |--------------------------------------------------------------------------
    |
    | Seconds a generation may take. Creating a Laravel project downloads
    | Composer and npm packages, which can take several minutes.
    |
    */

    'timeout' => (int) env('SCHOOLFORGE_TIMEOUT', 1800),

    /*
    |--------------------------------------------------------------------------
    | Component Code Editing
    |--------------------------------------------------------------------------
    |
    | Lets signed-in users edit component source code (React/TSX) in the
    | browser. That code runs in every generated site, so it is only enabled
    | for local development by default.
    |
    */

    'code_editing' => (bool) env('SCHOOLFORGE_CODE_EDITING', env('APP_ENV') === 'local'),

    /*
    |--------------------------------------------------------------------------
    | Hosting
    |--------------------------------------------------------------------------
    |
    | Studio can serve published schools itself. Each school answers on its own
    | domain (point its DNS at this server) and, when this is set, on
    | <school-slug>.<hosting_domain> (point a wildcard DNS record here).
    |
    */

    'hosting_domain' => env('SCHOOLFORGE_HOSTING_DOMAIN'),

    'hosting_scheme' => env('SCHOOLFORGE_HOSTING_SCHEME', 'https'),

    // This server's public IP addresses (comma separated), for checking schools' DNS.
    // When empty, the addresses of APP_URL's host are used.
    'server_ips' => env('SCHOOLFORGE_SERVER_IPS'),

    /*
    |--------------------------------------------------------------------------
    | Billing
    |--------------------------------------------------------------------------
    |
    | Invoices for hosted schools are issued this many days before the paid
    | period ends. A hosted school whose payment is this many days late shows
    | a "temporarily unavailable" page until it is paid.
    |
    */

    'invoice_days_before' => (int) env('SCHOOLFORGE_INVOICE_DAYS_BEFORE', 14),

    'grace_days' => (int) env('SCHOOLFORGE_GRACE_DAYS', 14),

    /*
    | A filesystem disk (config/filesystems.php) that each nightly backup is also
    | copied to, e.g. a network drive or object storage. Empty keeps backups on
    | this server only.
    */

    'backup_disk' => env('SCHOOLFORGE_BACKUP_DISK'),

    'billing_from' => env('SCHOOLFORGE_BILLING_FROM', env('APP_NAME', 'SchoolForge')),

];
