<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToShop
{
    protected static function bootBelongsToShop(): void
    {
        static::addGlobalScope('shop', function (Builder $builder) {
            if (Auth::check()) {
                $builder->where(
                    $builder->getModel()->getTable().'.shop_id',
                    Auth::user()->shop_id
                    );
            } elseif (! app()->runningInConsole()) {
                $builder->whereRaw('1 = 0');
            }
        });

        static::creating(function ($model) {
            if (! $model->shop_id && Auth::check()) {
                $model->shop_id = Auth::user()->shop_id;
            }
        });
    }
}
