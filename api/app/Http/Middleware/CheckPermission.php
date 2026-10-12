<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    private const ACTIONS = ['view', 'create', 'edit', 'delete', 'export'];

    public function handle(Request $request, Closure $next, string $module, string $action): Response
    {
        $user = $request->user();

        if (! $user || ! $user->is_active || ! in_array($action, self::ACTIONS, true)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $allowed = DB::table('role_permissions')
            ->where('role_id', $user->role_id)
            ->where('module', $module)
            ->value('can_'.$action);

        if (! $allowed) {
            return response()->json(['message' => 'You do not have permission for this action.'], 403);
        }

        return $next($request);
    }
}
