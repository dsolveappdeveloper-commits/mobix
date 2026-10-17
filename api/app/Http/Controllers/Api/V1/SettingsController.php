<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\DefaultSettings;
use App\Support\ShopSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(ShopSettings::all($request->user()->shop_id));
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate(['settings' => ['required', 'array']]);

        $shopId = $request->user()->shop_id;
        $errors = [];
        $clean = [];

        // Key la dot irukkarathaala (job.default_warranty_days), Laravel nested rules use panna mudiyaadhu, adhanaala oru oru value ah thaniya validate pannurom
        foreach ($request->input('settings') as $key => $value) {
            if (! array_key_exists($key, DefaultSettings::DEFAULTS)) {
                $errors[$key] = ['Unknown setting.'];
                continue;
            }

            $default = DefaultSettings::DEFAULTS[$key];
            $validator = Validator::make(['value' => $value], ['value' => ShopSettings::rulesFor($key, $default)]);

            if ($validator->fails()) {
                $errors[$key] = $validator->errors()->get('value');
                continue;
            }

            $clean[$key] = ShopSettings::cast($value, $default);
        }

        if ($errors) {
            return response()->json(['message' => 'The given data was invalid.', 'errors' => $errors], 422);
        }

        $old = ShopSettings::all($shopId);

        $rows = [];
        foreach ($clean as $key => $value) {
            $rows[] = [
                'shop_id'    => $shopId,
                'key'        => $key,
                'value'      => json_encode($value),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if ($rows) {
            DB::table('settings')->upsert($rows, ['shop_id', 'key'], ['value', 'updated_at']);
        }

        // Maariya settings mattum audit log la
        $changedOld = [];
        $changedNew = [];
        foreach ($clean as $key => $value) {
            if ($old[$key] !== $value) {
                $changedOld[$key] = $old[$key];
                $changedNew[$key] = $value;
            }
        }

        if ($changedNew) {
            DB::table('audit_logs')->insert([
                'shop_id'    => $shopId,
                'user_id'    => $request->user()->id,
                'module'     => 'settings',
                'record_id'  => null,
                'action'     => 'updated',
                'old_json'   => json_encode($changedOld),
                'new_json'   => json_encode($changedNew),
                'ip_address' => $request->ip(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(ShopSettings::all($shopId));
    }
}
