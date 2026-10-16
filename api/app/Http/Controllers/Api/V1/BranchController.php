<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Branch::query()->orderBy('name');

        if ($user->role->name !== 'Admin') {
            $query->whereHas('users', fn ($q) => $q->where('users.id', $user->id));
        }

        if ($request->filled('q')) {
            $query->where('name', 'like', '%'.$request->q.'%');
        }

        if ($request->filled('id')) {
            $query->where('id', $request->id);
        }

        return $query->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge(['code' => strtoupper((string) $request->code)]);

        $data = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'code'           => [
                'required', 'alpha', 'size:3',
                Rule::unique('branches')->where('shop_id', $request->user()->shop_id),
            ],
            'address'        => ['nullable', 'string'],
            'phone'          => ['nullable', 'string', 'max:15'],
            'gstin'          => ['nullable', 'string', 'size:15'],
            'invoice_prefix' => ['nullable', 'string', 'max:10'],
            'opening_time'   => ['nullable', 'date_format:H:i'],
            'is_active'      => ['sometimes', 'boolean'],
        ]);

        $branch = Branch::create($data);

        return response()->json($branch, 201);
    }

    public function show(Branch $branch): Branch
    {
        return $branch;
    }

        public function update(Request $request, Branch $branch): Branch
        {
        if ($request->has('code')) {
            $request->merge(['code' => strtoupper((string) $request->code)]);
        }

        $data = $request->validate([
            'name'           => ['sometimes', 'required', 'string', 'max:255'],
            'code'           => [
                'sometimes', 'required', 'alpha', 'size:3',
                Rule::unique('branches')
                    ->where('shop_id', $request->user()->shop_id)
                    ->ignore($branch->id),
            ],
            'address'        => ['nullable', 'string'],
            'phone'          => ['nullable', 'string', 'max:15'],
            'gstin'          => ['nullable', 'string', 'size:15'],
            'invoice_prefix' => ['nullable', 'string', 'max:10'],
            'opening_time'   => ['nullable', 'date_format:H:i'],
            'is_active'      => ['sometimes', 'boolean'],
        ]);

        $branch->update($data);

        return $branch;
    }

    public function destroy(Branch $branch): JsonResponse
    {
        if (Branch::count() <= 1) {
            return response()->json(['message' => 'Cannot delete the only branch.'], 422);
        }

        $branch->delete();

        return response()->json(['message' => 'Branch deleted.']);
    }
}
