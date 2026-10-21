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

];
