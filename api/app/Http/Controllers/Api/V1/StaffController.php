<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    private function staffQuery(Request $request)
    {
        return User::query()
            ->where('shop_id', $request->user()->shop_id)
            ->with(['role:id,name', 'branches:id,name,code']);
    }

    private function rules(Request $request, ?int $ignoreId = null): array
    {
        $shopId = $request->user()->shop_id;
        $creating = $ignoreId === null;

        return [
            'name'           => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'mobile'         => [
                $creating ? 'required' : 'sometimes', 'digits:10',
                Rule::unique('users')->ignore($ignoreId),
            ],
            'email'          => [
                'nullable', 'email',
                Rule::unique('users')->ignore($ignoreId),
            ],
            'password'       => [$creating ? 'required' : 'sometimes', 'string', 'min:8'],
            'role_id'        => [
                $creating ? 'required' : 'sometimes',
                Rule::exists('roles', 'id')->where('shop_id', $shopId)->whereNull('deleted_at'),
            ],
            'branch_ids'     => [$creating ? 'required' : 'sometimes', 'array', 'min:1'],
            'branch_ids.*'   => [
                Rule::exists('branches', 'id')->where('shop_id', $shopId)->whereNull('deleted_at'),
            ],
            'commission_pct' => ['nullable', 'numeric', 'between:0,100'],
            'is_active'      => ['sometimes', 'boolean'],
        ];
    }

    private function isLastActiveAdmin(User $user): bool
    {
        if ($user->role?->name !== 'Admin') {
            return false;
        }

        return User::where('shop_id', $user->shop_id)
            ->where('role_id', $user->role_id)
            ->where('is_active', true)
            ->where('id', '!=', $user->id)
            ->doesntExist();
    }

    private function syncBranches(User $user, array $branchIds): void
    {
        $pivot = [];
        foreach ($branchIds as $id) {
            $pivot[$id] = ['shop_id' => $user->shop_id];
        }
        $user->branches()->sync($pivot);
    }

    public function index(Request $request)
    {
        $query = $this->staffQuery($request)->orderBy('name');

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(fn ($w) => $w->where('name', 'like', "%$q%")
                ->orWhere('mobile', 'like', "%$q%"));
        }

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        return $query->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules($request));

        $branchIds = $data['branch_ids'];
        unset($data['branch_ids']);

        $data['shop_id'] = $request->user()->shop_id;
        $data['is_active'] = $data['is_active'] ?? true;

        $user = User::create($data);
        $this->syncBranches($user, $branchIds);

        return response()->json($user->load(['role:id,name', 'branches:id,name,code']), 201);
    }

    public function show(Request $request, int $id): User
    {
        return $this->staffQuery($request)->findOrFail($id);
    }

    public function update(Request $request, int $id): User|JsonResponse
    {
        $user = $this->staffQuery($request)->findOrFail($id);

        $data = $request->validate($this->rules($request, $user->id));

        if (array_key_exists('is_active', $data) && ! $data['is_active'] && $user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot deactivate yourself.'], 422);
        }

        $losingAdmin = (array_key_exists('is_active', $data) && ! $data['is_active'])
            || (isset($data['role_id']) && (int) $data['role_id'] !== $user->role_id);

        if ($losingAdmin && $this->isLastActiveAdmin($user)) {
            return response()->json(['message' => 'The shop must keep at least one active Admin.'], 422);
        }

        $branchIds = $data['branch_ids'] ?? null;
        unset($data['branch_ids']);

        $user->update($data);

        if ($branchIds !== null) {
            $this->syncBranches($user, $branchIds);
        }

        // deactivated staff must be logged out everywhere
        if (array_key_exists('is_active', $data) && ! $data['is_active']) {
            $user->tokens()->delete();
        }

        return $user->load(['role:id,name', 'branches:id,name,code']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $this->staffQuery($request)->findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete yourself.'], 422);
        }

        if ($this->isLastActiveAdmin($user)) {
            return response()->json(['message' => 'The shop must keep at least one active Admin.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Staff deleted.']);
    }
}
