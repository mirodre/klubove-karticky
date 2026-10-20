<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Ako vstavaný `guest`, ale hosťa (prihláseného bez účtu) na prihlásenie/registráciu pustí. */
class RedirectIfRegistered
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->isGuest()) {
            return redirect('/');
        }

        return $next($request);
    }
}
