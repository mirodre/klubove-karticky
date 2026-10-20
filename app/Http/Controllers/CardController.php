<?php

namespace App\Http\Controllers;

use App\Models\Card;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'cards' => $request->user()->cards()->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $card = $request->user()->cards()->create($request->validate($this->rules()));

        return response()->json(['card' => $card], 201);
    }

    public function update(Request $request, Card $card): JsonResponse
    {
        $this->authorizeOwner($request, $card);

        $card->update($request->validate($this->rules()));

        return response()->json(['card' => $card]);
    }

    public function destroy(Request $request, Card $card): Response
    {
        $this->authorizeOwner($request, $card);

        $card->delete();

        return response()->noContent();
    }

    /** Zaznamená zobrazenie karty pri pokladni – podklad pre „Často používané“. */
    public function use(Request $request, Card $card): JsonResponse
    {
        $this->authorizeOwner($request, $card);

        $card->forceFill([
            'uses' => $card->uses + 1,
            'last_used_at' => now(),
        ])->save();

        return response()->json(['card' => $card]);
    }

    /** Obnova zo zálohy (JSON exportovaný z aplikácie). Duplicitné karty preskočí. */
    public function import(Request $request): JsonResponse
    {
        $request->validate(['cards' => ['required', 'array', 'max:500']]);

        $rules = collect($this->rules())
            ->mapWithKeys(fn ($rule, $key) => ["cards.*.$key" => $rule])
            ->all();
        $data = $request->validate($rules + [
            'cards.*.uses' => ['nullable', 'integer', 'min:0'],
            'cards.*.last_used_at' => ['nullable', 'date'],
        ]);

        $user = $request->user();
        $existing = $user->cards()->get(['name', 'number'])
            ->map(fn (Card $c) => mb_strtolower($c->name).'|'.$c->number)
            ->flip();

        $created = 0;
        DB::transaction(function () use ($data, $user, $existing, &$created) {
            foreach ($data['cards'] as $item) {
                $key = mb_strtolower($item['name']).'|'.$item['number'];
                if ($existing->has($key)) {
                    continue;
                }
                $user->cards()->create($item);
                $existing->put($key, true);
                $created++;
            }
        });

        return response()->json([
            'imported' => $created,
            'cards' => $user->cards()->orderBy('name')->get(),
        ]);
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
