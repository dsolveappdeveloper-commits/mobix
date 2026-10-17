<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class MasterController extends Controller
{
    // Child controllers ivatrai kandippa kudukkanum
    abstract protected function model(): string;

    abstract protected function rules(Request $request, ?int $ignoreId = null): array;

    // Child controllers venum na override pannalam
    protected function filter(Builder $query, Request $request): void
    {
    }

    protected function relations(): array
    {
        return [];
    }

    protected function orderColumn(): string
    {
        return 'name';
    }

    // Soft-deleted record kandu pidikka use aagura fields
    protected function identityFields(): array
    {
        return ['name'];
    }

    // null = delete pannalam, illana reason message
    protected function deleteBlocker(Model $record): ?string
    {
        return null;
    }

    public function index(Request $request)
    {
        $class = $this->model();
        $query = $class::query()->with($this->relations())->orderBy($this->orderColumn());

        if ($request->filled('q')) {
            $query->where('name', 'like', '%'.$request->q.'%');
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $this->filter($query, $request);

        return $query->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules($request));
        $class = $this->model();

        // Same name already soft-delete aagi irundha restore pannidrom
        $lookup = array_intersect_key($data, array_flip($this->identityFields()));
        $existing = $class::onlyTrashed()->where($lookup)->first();

        if ($existing) {
            $existing->restore();
            $existing->update($data);
            $record = $existing;
        } else {
            $record = $class::create($data);
        }

        return response()->json($record->load($this->relations()), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $class = $this->model();
        $record = $class::findOrFail($id);

        $record->update($request->validate($this->rules($request, $id)));

        return response()->json($record->load($this->relations()));
    }

    public function destroy(int $id): JsonResponse
    {
        $class = $this->model();
        $record = $class::findOrFail($id);

        if ($reason = $this->deleteBlocker($record)) {
            return response()->json(['message' => $reason], 422);
        }

        $record->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
