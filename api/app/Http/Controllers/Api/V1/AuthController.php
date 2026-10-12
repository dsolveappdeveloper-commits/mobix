<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Role;
use App\Models\Shop;
use App\Models\User;
use App\Support\DefaultRoles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'shop_name'  => ['required', 'string', 'max:255'],
            'owner_name' => ['required', 'string', 'max:255'],
            'mobile'     => ['required', 'digits:10', 'unique:shops,mobile'],
            'email'      => ['required', 'email', 'unique:shops,email'],
            'password'   => ['required', 'string', 'min:8'],
            'city'       => ['nullable', 'string', 'max:255'],
            'gstin'      => ['nullable', 'string', 'size:15'],
        ]);

        $otp = (string) random_int(100000, 999999);

        Cache::put('signup:'.$data['mobile'], [
            'data' => array_merge($data, ['password' => Hash::make($data['password'])]),
            'otp'  => Hash::make($otp),
        ], now()->addMinutes(10));

        Log::info("MobiX signup OTP for {$data['mobile']}: {$otp}");

        return response()->json([
            'message' => 'OTP sent to mobile. Valid for 10 minutes.',
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $input = $request->validate([
            'mobile' => ['required', 'digits:10'],
            'otp'    => ['required', 'digits:6'],
        ]);

        $key = 'signup:'.$input['mobile'];
        $pending = Cache::get($key);

        if (! $pending) {
            return response()->json(['message' => 'OTP expired. Please sign up again.'], 422);
        }

        if (! Hash::check($input['otp'], $pending['otp'])) {
            return response()->json(['message' => 'Invalid OTP.'], 422);
        }

        $data = $pending['data'];

        $user = DB::transaction(function () use ($data) {
            $shop = Shop::create([
                'name'       => $data['shop_name'],
                'owner_name' => $data['owner_name'],
                'mobile'     => $data['mobile'],
                'email'      => $data['email'],
                'city'       => $data['city'] ?? null,
                'gstin'      => $data['gstin'] ?? null,
            ]);

            $branch = Branch::create([
                'shop_id' => $shop->id,
                'name'    => 'Main',
                'code'    => 'MAI',
            ]);

            DefaultRoles::createForShop($shop->id);

            $adminRole = Role::where('shop_id', $shop->id)
                ->where('name', 'Admin')
                ->firstOrFail();

            $user = User::create([
                'shop_id'   => $shop->id,
                'role_id'   => $adminRole->id,
                'name'      => $data['owner_name'],
                'mobile'    => $data['mobile'],
                'email'     => $data['email'],
                'password'  => $data['password'],
                'is_active' => true,
            ]);

            $user->branches()->attach($branch->id, ['shop_id' => $shop->id]);

            return $user;
        });

        Cache::forget($key);

        return response()->json([
            'message' => 'Shop created.',
            'token'   => $user->createToken('web')->plainTextToken,
            'user'    => $user->only(['id', 'name', 'mobile', 'email', 'shop_id', 'role_id']),
        ], 201);
    }

     public function login(Request $request): JsonResponse
    {
        $input = $request->validate([
            'identifier' => ['required', 'string'],
            'password'   => ['required', 'string'],
            'remember'   => ['sometimes', 'boolean'],
        ]);

        $identifier = $input['identifier'];

        // failures count only after the last success, within 15 minutes
        $since = now()->subMinutes(15);
        $lastSuccess = DB::table('login_logs')
            ->where('identifier', $identifier)
            ->where('status', 'success')
            ->max('created_at');

        if ($lastSuccess && Carbon::parse($lastSuccess)->gt($since)) {
            $since = Carbon::parse($lastSuccess);
        }

        $fails = DB::table('login_logs')
            ->where('identifier', $identifier)
            ->where('status', 'failed')
            ->where('created_at', '>', $since)
            ->count();

        if ($fails >= 5) {
            $this->logAttempt(null, $identifier, 'locked', $request);

            return response()->json([
                'message' => 'Too many wrong attempts. Try again after 15 minutes.',
            ], 429);
        }

        $user = User::where('mobile', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if (! $user || ! $user->is_active || ! Hash::check($input['password'], $user->password)) {
            $this->logAttempt($user, $identifier, 'failed', $request);

            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $this->logAttempt($user, $identifier, 'success', $request);

        $expires = ($input['remember'] ?? false) ? now()->addDays(30) : now()->addHours(12);

        return response()->json([
            'message' => 'Login success.',
            'token'   => $user->createToken('web', ['*'], $expires)->plainTextToken,
            'user'    => $user->only(['id', 'name', 'mobile', 'email', 'shop_id', 'role_id']),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role:id,name');

        $permissions = DB::table('role_permissions')
            ->where('role_id', $user->role_id)
            ->get()
            ->mapWithKeys(fn ($p) => [$p->module => [
                'view'   => (bool) $p->can_view,
                'create' => (bool) $p->can_create,
                'edit'   => (bool) $p->can_edit,
                'delete' => (bool) $p->can_delete,
                'export' => (bool) $p->can_export,
            ]]);

        $branches = $user->role?->name === 'Admin'
            ? Branch::orderBy('name')->get(['id', 'name', 'code'])
            : $user->branches()->orderBy('name')->get(['branches.id', 'branches.name', 'branches.code']);

        return response()->json([
            'user'        => $user->only(['id', 'name', 'mobile', 'email', 'shop_id']),
            'role'        => $user->role,
            'permissions' => $permissions,
            'branches'    => $branches,
        ]);
    }


    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    private function logAttempt(?User $user, string $identifier, string $status, Request $request): void
    {
        DB::table('login_logs')->insert([
            'shop_id'    => $user?->shop_id,
            'user_id'    => $user?->id,
            'identifier' => $identifier,
            'status'     => $status,
            'ip_address' => $request->ip(),
            'device'     => substr((string) $request->userAgent(), 0, 255),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}



