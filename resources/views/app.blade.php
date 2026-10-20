<!DOCTYPE html>
<html lang="sk">
<head>
    @include('layouts.head')
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Kardo</title>
</head>
<body>
<main id="app" aria-live="polite"></main>
<div id="toast" role="status" hidden></div>

<script>
    window.APP_USER = @json(auth()->user()?->toAppUser());
</script>
<script src="/vendor/jsbarcode.min.js" defer></script>
<script src="/vendor/qrcode.js" defer></script>
<script src="/app.js?v={{ $assetVersion }}" defer></script>
</body>
</html>
