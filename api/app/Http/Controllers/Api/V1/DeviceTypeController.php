<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\DeviceModel;
use App\Models\DeviceType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DeviceTypeController extends MasterController
{
    protected function model(): string
    {
        return DeviceType::class;
    }

    protected function orderColumn(): string
    {
        return 'sort_order';
    }

    protected function rules(Request $request, ?int $ignoreId = null): array
    {
        $req = $ignoreId ? 'sometimes' : 'required';

        return [
            'name' => [
                $req, 'string', 'max:100',
                Rule::unique('device_types')
                    ->where('shop_id', $request->user()->shop_id)
                    ->whereNull('deleted_at')
                    ->ignore($ignoreId),
            ],
            'requires_imei' => ['sometimes', 'boolean'],
            'sort_order'    => ['sometimes', 'integer', 'between:0,1000'],
            'is_active'     => ['sometimes', 'boolean'],
        ];
    }

    protected function deleteBlocker(Model $record): ?string
    {
        return DeviceModel::where('device_type_id', $record->id)->exists()
            ? 'This device type has models. Delete them first.'
            : null;
    }
}
