<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
protected $fillable = [
    'shop_id',
    'role_id',
    'name',
    'mobile',
    'email',
    'password',
    'commission_pct',
    'is_active',
];
    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
'password' => 'hashed',
'is_active' => 'boolean',
'commission_pct' => 'decimal:2',
];
}

public function shop(): BelongsTo
{
    return $this->belongsTo(Shop::class);
}

public function role(): BelongsTo
{
    return $this->belongsTo(Role::class);
}

public function branches(): BelongsToMany
{
    return $this->belongsToMany(Branch::class, 'user_branches')
        ->withPivot('shop_id')
        ->withTimestamps();
}
}
