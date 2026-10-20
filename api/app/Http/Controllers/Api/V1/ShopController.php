<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    private function payload(Shop $shop): array
    {
        return $shop->only([
            'id', 'name', 'owner_name', 'mobile', 'email', 'phone',
            'address', 'city', 'state', 'gstin', 'website', 'review_link',
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        return response()->json($this->payload($request->user()->shop));
    }

    // Owner mobile / email account details, adhanaala inge maatha mudiyaadhu
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'owner_name'  => ['required', 'string', 'max:255'],
            'phone'       => ['nullable', 'string', 'max:15'],
            'address'     => ['nullable', 'string', 'max:1000'],
            'city'        => ['nullable', 'string', 'max:255'],
            'state'       => ['nullable', 'string', 'max:100'],
            'gstin'       => ['nullable', 'string', 'size:15'],
            'website'     => ['nullable', 'url', 'max:255'],
            'review_link' => ['nullable', 'url', 'max:500'],
        ]);

        $shop = $request->user()->shop;
        $shop->update($data);

        return response()->json($this->payload($shop->fresh()));
    }
}   
