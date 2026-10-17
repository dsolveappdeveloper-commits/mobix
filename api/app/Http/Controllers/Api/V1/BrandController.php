<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Brand;
use App\Models\DeviceModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BrandController extends MasterController
{
    protected function model(): string
    {
        return Brand::class;
    }

    protected function rules(Request $request, ?int $ignoreId = null): array
    {
        $req = $ignoreId ? 'sometimes' : 'required';

        return [
            'name' => [
                $req, 'string', 'max:100',
                Rule::unique('brands')
                    ->where('shop_id', $request->user()->shop_id)
                    ->whereNull('deleted_at')
                    ->ignore($ignoreId),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function deleteBlocker(Model $record): ?string
    {
        return DeviceModel::where('brand_id', $record->id)->exists()
            ? 'This brand has models. Delete them first.'
            : null;
    }
}
