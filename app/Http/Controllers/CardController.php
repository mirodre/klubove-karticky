<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'cards' => $request->user()?->cards()->with('places')->orderBy('name')->get() ?? [],
        ]);
    }

    /** Prvá karta návštevníka bez účtu mu založí hosťovský účet, aby sa dala neskôr previazať s registráciou. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        $user = $request->user();
        if (! $user) {
            $user = User::create();
            Auth::login($user, remember: true);
            $request->session()->regenerate();
        }

        $card = $user->cards()->create($data);

        return response()->json(['card' => $card->load('places'), 'user' => $user->toAppUser()], 201);
    }

    public function update(Request $request, Card $card): JsonResponse
    {
        $this->authorizeOwner($request, $card);

        $card->update($request->validate($this->rules()));

        return response()->json(['card' => $card->load('places')]);
    }

    public function destroy(Request $request, Card $card): Response
    {
        $this->authorizeOwner($request, $card);

        $card->delete();

        return response()->noContent();
    }

    /**
     * Zaznamená zobrazenie karty pri pokladni – podklad pre „Často používané“.
     * Ak príde aj poloha, zapamätá si miesto, aby appka vedela kartu ponúknuť nabudúce na tom istom mieste.
     */
    public function use(Request $request, Card $card): JsonResponse
    {
        $this->authorizeOwner($request, $card);

        $position = $request->validate([
            'lat' => ['nullable', 'required_with:lng', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'required_with:lat', 'numeric', 'between:-180,180'],
        ]);

        $card->forceFill([
            'uses' => $card->uses + 1,
            'last_used_at' => now(),
        ])->save();

        if (isset($position['lat'], $position['lng'])) {
            $card->rememberPlace((float) $position['lat'], (float) $position['lng']);
        }

        return response()->json(['card' => $card->load('places')]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'kind' => ['nullable', 'string', 'max:80'],
            'number' => ['required', 'string', 'max:255'],
            'format' => ['required', Rule::in(Card::FORMATS)],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'holder' => ['nullable', 'string', 'max:80'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    private function authorizeOwner(Request $request, Card $card): void
    {
        abort_unless($card->user_id === $request->user()->id, 404);
    }
}
