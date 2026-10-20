<!DOCTYPE html>
<html lang="sk">
<head>
    @include('layouts.head')
    <title>@yield('title') · Kardo</title>
</head>
<body>
<main class="screen empty auth">
    <header class="auth-brand">
        <img src="/icons/logo.svg" alt="" width="88" height="88">
        <h1 class="wordmark">kardo<span>.</span></h1>
        <p class="tagline">Your cards. Already there.</p>
    </header>

    @yield('content')
</main>
<script>
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
</script>
</body>
</html>
