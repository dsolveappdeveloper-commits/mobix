<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class OtpAuthController extends Controller
{
    // ---------- Forgot password ----------

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['identifier' => ['required', 'string']]);

        $user = $this->findUser($data['identifier']);

        if ($user && $user->is_active) {
            $otp = $this->issueOtp('reset:'.$user->id);
            Log::info("MobiX password reset OTP for {$user->mobile}: {$otp}");
        }

        // account irukka illaiyanu veliya theriya koodaadhu, adhanaala eppavum ore message
        return response()->json(['message' => 'If the account exists, an OTP has been sent.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string'],
            'otp'        => ['required', 'digits:6'],
            'password'   => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $this->findUser($data['identifier']);

        if (! $user || ! $user->is_active || ! $this->checkOtp('reset:'.$user->id, $data['otp'])) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }

        $user->update(['password' => $data['password']]);
        $user->tokens()->delete(); // ellaa devices layum logout

        return response()->json(['message' => 'Password updated. Please sign in.']);
    }

    // ---------- Login with OTP ----------

    public function sendLoginOtp(Request $request): JsonResponse
    {
        $data = $request->validate(['mobile' => ['required', 'digits:10']]);

        $user = User::where('mobile', $data['mobile'])->first();

        if ($user && $user->is_active) {
            $otp = $this->issueOtp('loginotp:'.$user->id);
            Log::info("MobiX login OTP for {$user->mobile}: {$otp}");
        }

        return response()->json(['message' => 'If the account exists, an OTP has been sent.']);
    }

    public function verifyLoginOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mobile'   => ['required', 'digits:10'],
            'otp'      => ['required', 'digits:6'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $user = User::where('mobile', $data['mobile'])->first();

        if (! $user || ! $user->is_active || ! $this->checkOtp('loginotp:'.$user->id, $data['otp'])) {
            $this->logAttempt($user, $data['mobile'], 'failed', $request);

            return response()->json(['message' => 'Invalid or expired OTP.'], 401);
        }

        $this->logAttempt($user, $data['mobile'], 'success', $request);

        $expires = ($data['remember'] ?? false) ? now()->addDays(30) : now()->addHours(12);

        return response()->json([
            'message' => 'Login success.',
            'token'   => $user->createToken('web', ['*'], $expires)->plainTextToken,
            'user'    => $user->only(['id', 'name', 'mobile', 'email', 'shop_id', 'role_id']),
        ]);
    }

    // ---------- helpers ----------

    private function findUser(string $identifier): ?User
    {
        return User::where('mobile', $identifier)->orWhere('email', $identifier)->first();
    }

    private function issueOtp(string $key): string
    {
        $otp = (string) random_int(100000, 999999);

        Cache::put($key, ['otp' => Hash::make($otp), 'attempts' => 0], now()->addMinutes(10));

        return $otp;
    }

    // Maximum 5 thappa try, appuram OTP expire aagidum
    private function checkOtp(string $key, string $otp): bool
    {
        $entry = Cache::get($key);

        if (! $entry) {
            return false;
        }

        if ($entry['attempts'] >= 5) {
            Cache::forget($key);

            return false;
        }

        if (! Hash::check($otp, $entry['otp'])) {
            $entry['attempts']++;
            Cache::put($key, $entry, now()->addMinutes(10));

            return false;
        }

        Cache::forget($key); // OTP oru thadavai mattum use pannalaam

        return true;
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
