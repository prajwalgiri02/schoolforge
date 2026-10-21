<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Unsubscribed · {{ config('app.name') }}</title>
    <style>
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #f4f4f5; color: #18181b; }
        main { max-width: 28rem; margin: 1rem; padding: 2rem; background: #fff; border-radius: 1rem; text-align: center; box-shadow: 0 1px 3px rgb(0 0 0 / .1); }
        a { color: inherit; }
    </style>
</head>
<body>
    <main>
        <h1>You are unsubscribed</h1>
        <p>You will no longer receive news and alerts from {{ config('app.name') }}.</p>
        <p><a href="{{ url('/') }}">Back to the website</a></p>
    </main>
</body>
</html>
