<?php

namespace App\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ShopSettings
{
    // Defaults + shop maathina values merge panni kudukkum
    public static function all(int $shopId): array
    {
        $saved = DB::table('settings')->where('shop_id', $shopId)->pluck('value', 'key');

        $result = [];
        foreach (DefaultSettings::DEFAULTS as $key => $default) {
            $result[$key] = $saved->has($key) ? json_decode($saved[$key], true) : $default;
        }

        return $result;
    }

    // Edha module la irundhum: ShopSettings::get('job.default_warranty_days')
    public static function get(string $key, ?int $shopId = null): mixed
    {
        $shopId ??= Auth::user()?->shop_id;

        return self::all($shopId)[$key] ?? DefaultSettings::DEFAULTS[$key] ?? null;
    }

    // Ovvoru setting ku validation rules
    public static function rulesFor(string $key, mixed $default): array
    {
        $special = [
            'job.default_promised_days'      => ['required', 'integer', 'between:0,30'],
            'job.default_warranty_days'      => ['required', 'integer', 'between:0,3650'],
            'tax.default_labour_gst'         => ['required', 'numeric', 'between:0,100'],
            'tax.financial_year_start'       => ['required', 'integer', 'between:1,12'],
            'discount.front_desk_max_pct'    => ['required', 'numeric', 'between:0,100'],
            'notify.quiet_start'             => ['required', 'date_format:H:i'],
            'notify.quiet_end'               => ['required', 'date_format:H:i'],
            'inventory.low_stock_alert_time' => ['required', 'date_format:H:i'],
            'inventory.costing_method'       => ['required', 'in:weighted_average'],
            'print.invoice_paper'            => ['required', 'in:A4,A5,80mm,58mm'],
            'print.job_sheet_paper'          => ['required', 'in:A4,A5,80mm,58mm'],
            'print.label_paper'              => ['required', 'in:50x25'],
            'notify.tracking_base_url'       => ['nullable', 'url'],
        ];

        if (isset($special[$key])) {
            return $special[$key];
        }

        // special rule illana default value oda type padi
        if (is_bool($default)) {
            return ['required', 'boolean'];
        }

        return ['nullable', 'string', 'max:2000'];
    }

    // Value ah default oda type ku maathum (bool / number / string)
    public static function cast(mixed $value, mixed $default): mixed
    {
        if (is_bool($default)) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }

        if (is_int($default)) {
            return $value + 0; // "18" -> 18, "18.5" -> 18.5
        }

        return (string) ($value ?? '');
    }
}
