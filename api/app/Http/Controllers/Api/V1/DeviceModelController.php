<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\DeviceModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DeviceModelController extends MasterController
{
    protected function model(): string
    {
        return DeviceModel::class;
    }

    protected function relations(): array
    {
        return ['brand:id,name', 'deviceType:id,name'];
    }

    protected function identityFields(): array
    {
        return ['brand_id', 'device_type_id', 'name'];
    }

    // New Job la: brand + device type select panna model list filter aagum
    protected function filter(Builder $query, Request $request): void
    {
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        if ($request->filled('device_type_id')) {
            $query->where('device_type_id', $request->device_type_id);
        }
    }

    protected function rules(Request $request, ?int $ignoreId = null): array
    {
        $shopId = $request->user()->shop_id;

        return [
            'brand_id' => [
                'required',
                Rule::exists('brands', 'id')->where('shop_id', $shopId)->whereNull('deleted_at'),
            ],
            'device_type_id' => [
                'required',
                Rule::exists('device_types', 'id')->where('shop_id', $shopId)->whereNull('deleted_at'),
            ],
            'name' => [
                'required', 'string', 'max:150',
                Rule::unique('models')
                    ->where('shop_id', $shopId)
                    ->where('brand_id', $request->brand_id)
                    ->where('device_type_id', $request->device_type_id)
                    ->whereNull('deleted_at')
                    ->ignore($ignoreId),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
