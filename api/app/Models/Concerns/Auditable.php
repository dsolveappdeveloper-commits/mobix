<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            self::writeAudit($model, 'created', null, self::clean($model, $model->getAttributes()));
        });

        static::updated(function (Model $model) {
            $changes = self::clean($model, $model->getChanges());

            if (! $changes) {
                return;
            }

            $old = array_intersect_key($model->getOriginal(), $changes);

            self::writeAudit($model, 'updated', $old, $changes);
        });

        static::deleted(function (Model $model) {
            self::writeAudit($model, 'deleted', self::clean($model, $model->getAttributes()), null);
        });
    }

    private static function clean(Model $model, array $attributes): array
    {
        $skip = array_merge(
            $model->getHidden(),
            ['created_at', 'updated_at', 'deleted_at']
        );

        return array_diff_key($attributes, array_flip($skip));
    }

    private static function writeAudit(Model $model, string $action, ?array $old, ?array $new): void
    {
        $shopId = $model->shop_id ?? Auth::user()?->shop_id;

        if (! $shopId) {
            return;
        }

        DB::table('audit_logs')->insert([
            'shop_id'    => $shopId,
            'user_id'    => Auth::id(),
            'module'     => $model->getTable(),
            'record_id'  => $model->getKey(),
            'action'     => $action,
            'old_json'   => $old ? json_encode($old) : null,
            'new_json'   => $new ? json_encode($new) : null,
            'ip_address' => request()?->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
