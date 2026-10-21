<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToShop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes, BelongsToShop, Auditable;

    protected $fillable = [
        'shop_id', 'name', 'mobile', 'alt_mobile', 'email', 'address', 'city',
        'pincode', 'type', 'gstin', 'dob', 'notes', 'marketing_consent',
        'credit_limit', 'is_active', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'dob' => 'date:Y-m-d',
            'marketing_consent' => 'boolean',
            'is_active' => 'boolean',
            'credit_limit' => 'decimal:2',
        ];
    }
}
