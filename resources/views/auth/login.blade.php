@extends('layouts.auth')

@section('title', 'Prihlásenie')

@section('content')
    <form method="POST" action="/login" class="auth-form" novalidate>
        @csrf
        <div class="empty-text">
            <h2>Vitajte späť</h2>
            @if (auth()->user()?->isGuest())
                <p>Prihláste sa a karty z tohto zariadenia sa pridajú k vášmu účtu.</p>
            @else
                <p>Prihláste sa a vaše kartičky budú na každom zariadení.</p>
            @endif
        </div>

        <label class="field">
            <span>E-mail</span>
            <input type="email" name="email" value="{{ old('email') }}" autocomplete="email" inputmode="email" required autofocus>
        </label>
        <label class="field">
            <span>Heslo</span>
            <input type="password" name="password" autocomplete="current-password" required>
        </label>
        @if ($errors->any())
            <p class="form-error" role="alert">{{ $errors->first() }}</p>
        @endif

        <div class="actions">
            <button type="submit" class="btn btn-dark">Prihlásiť sa</button>
            <a href="/register" class="btn btn-ghost">Nemám účet – registrovať sa</a>
            <a href="/" class="btn btn-ghost">Pokračovať bez účtu</a>
        </div>
    </form>
@endsection
