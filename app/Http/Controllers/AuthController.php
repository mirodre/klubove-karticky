<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function showLogin(): View
    {
        return view('auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $guest = $request->user();

        if (! Auth::attempt($credentials, remember: true)) {
            return back()
                ->withErrors(['email' => 'Nesprávny e-mail alebo heslo.'])
                ->onlyInput('email');
        }

        // karty, ktoré si hosť pridal bez účtu, sa presunú do účtu
        if ($guest?->isGuest()) {
            $request->user()->absorb($guest);
        }

        $request->session()->regenerate();

        return redirect()->intended('/');
    }

    public function showRegister(): View
    {
        return view('auth.register');
    }

    public function register(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ], [
            'email.unique' => 'Účet s týmto e-mailom už existuje.',
            'password.confirmed' => 'Heslá sa nezhodujú.',
            'password.min' => 'Heslo musí mať aspoň 8 znakov.',
        ]);

        // hosť si ponechá svoj účet aj s kartami, len ho doplní o prihlasovacie údaje
        $user = $request->user();
        if ($user) {
            $user->update($data);
        } else {
            $user = User::create($data);
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect('/');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
