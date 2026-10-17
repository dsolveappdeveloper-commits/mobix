<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Support\DefaultRoles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    private const ACTIONS = ['view', 'create', 'edit', 'delete', 'export'];

    private function matrix(int $roleId): array
    {
        return DB::table('role_permissions')
            ->where('role_id', $roleId)
            ->get()
            ->mapWithKeys(fn ($p) => [$p->module => [
                'view'   => (bool) $p->can_view,
                'create' => (bool) $p->can_create,
                'edit'   => (bool) $p->can_edit,
                'delete' => (bool) $p->can_delete,
                'export' => (bool) $p->can_export,
            ]])
            ->all();
    }

    public function index(): JsonResponse
    {
        $roles = Role::orderBy('id')->get()->map(fn ($role) => [
            'id'          => $role->id,
            'name'        => $role->name,
            'is_system'   => $role->is_system,
            'permissions' => $this->matrix($role->id),
        ]);

        return response()->json($roles);
    }

    public function store(Request $request): JsonResponse
    {
        $shopId = $request->user()->shop_id;

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:50', Rule::unique('roles')->where('shop_id', $shopId)],
            'copy_from' => ['nullable', Rule::exists('roles', 'id')->where('shop_id', $shopId)->whereNull('deleted_at')],
        ]);

        $role = DB::transaction(function () use ($data, $shopId) {
            $role = Role::create(['shop_id' => $shopId, 'name' => $data['name'], 'is_system' => false]);

            // copy_from irundha andha role oda permissions copy aagum, illana ellam false
            $source = isset($data['copy_from'])
                ? DB::table('role_permissions')->where('role_id', $data['copy_from'])->get()->keyBy('module')
                : collect();

            foreach (DefaultRoles::MODULES as $module) {
                $p = $source->get($module);

                DB::table('role_permissions')->insert([
                    'shop_id'    => $shopId,
                    'role_id'    => $role->id,
                    'module'     => $module,
                    'can_view'   => $p->can_view ?? false,
                    'can_create' => $p->can_create ?? false,
                    'can_edit'   => $p->can_edit ?? false,
                    'can_delete' => $p->can_delete ?? false,
                    'can_export' => $p->can_export ?? false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $role;
        });

        return response()->json([
            'id'          => $role->id,
            'name'        => $role->name,
            'is_system'   => false,
            'permissions' => $this->matrix($role->id),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return response()->json(['message' => 'System roles cannot be renamed.'], 422);
        }

        $data = $request->validate([
            'name' => [
                'required', 'string', 'max:50',
                Rule::unique('roles')->where('shop_id', $request->user()->shop_id)->ignore($role->id),
            ],
        ]);

        $role->update($data);

        return response()->json(['id' => $role->id, 'name' => $role->name]);
    }

    public function destroy(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return response()->json(['message' => 'System roles cannot be deleted.'], 422);
        }

        if ($role->users()->exists()) {
            return response()->json(['message' => 'This role is assigned to staff. Change their role first.'], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted.']);
    }

    public function updatePermissions(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->is_system && $role->name === 'Admin') {
            return response()->json(['message' => 'Admin role permissions cannot be changed.'], 422);
        }

        $request->validate([
            'permissions'           => ['required', 'array'],
            'permissions.*.module'  => ['required', 'in:'.implode(',', DefaultRoles::MODULES)],
            'permissions.*.view'    => ['sometimes', 'boolean'],
            'permissions.*.create'  => ['sometimes', 'boolean'],
            'permissions.*.edit'    => ['sometimes', 'boolean'],
            'permissions.*.delete'  => ['sometimes', 'boolean'],
            'permissions.*.export'  => ['sometimes', 'boolean'],
        ]);

        $old = $this->matrix($role->id);

        DB::transaction(function () use ($request, $role) {
            foreach ($request->input('permissions') as $row) {
                $values = ['updated_at' => now()];
                foreach (self::ACTIONS as $action) {
                    $values['can_'.$action] = (bool) ($row[$action] ?? false);
                }

                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $role->id, 'module' => $row['module']],
                    $values + ['shop_id' => $role->shop_id, 'created_at' => now()]
                );
            }
        });

        $new = $this->matrix($role->id);

        DB::table('audit_logs')->insert([
            'shop_id'    => $role->shop_id,
            'user_id'    => $request->user()->id,
            'module'     => 'role_permissions',
            'record_id'  => $role->id,
            'action'     => 'updated',
            'old_json'   => json_encode($old),
            'new_json'   => json_encode($new),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message'     => 'Permissions updated.',
            'permissions' => $new,
        ]);
    }
}
