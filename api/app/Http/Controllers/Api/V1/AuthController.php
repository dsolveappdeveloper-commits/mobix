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
}
