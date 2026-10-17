<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToShop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeviceType extends Model
{
    use SoftDeletes, BelongsToShop, Auditable;

    protected $fillable = ['shop_id', 'name', 'requires_imei', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['requires_imei' => 'boolean', 'is_active' => 'boolean'];
    }
}
