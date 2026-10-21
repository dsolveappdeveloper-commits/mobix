<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    private function rules(Request $request, ?int $ignoreId = null): array
    {
        $req = $ignoreId ? 'sometimes' : 'required';

        return [
            'name' => [$req, 'string', 'max:150'],
            'mobile' => [
                $req, 'digits:10',
                Rule::unique('customers')
                    ->where('shop_id', $request->user()->shop_id)
                    ->whereNull('deleted_at')
                    ->ignore($ignoreId),
            ],
            'alt_mobile' => ['nullable', 'digits:10'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:10'],
            'type' => ['sometimes', Rule::in(['retail', 'dealer', 'corporate'])],
            'gstin' => ['nullable', 'string', 'size:15'],
            'dob' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'marketing_consent' => ['sometimes', 'boolean'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function messages(): array
    {
        return ['mobile.unique' => 'This mobile number already exists.'];
    }

    // Jobs/invoices tables varum varai idhu 0/null. Phase 2-3 la real numbers.
    private function format(Customer $c): array
    {
        return array_merge($c->toArray(), [
            'total_jobs' => 0,
            'total_spent' => 0,
            'balance_due' => 0,
            'last_visit' => null,
        ]);
    }

    public function index(Request $request)
    {
        $query = Customer::query()->orderBy('name');

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%$q%")
                  ->orWhere('mobile', 'like', "%$q%")
                  ->orWhere('alt_mobile', 'like', "%$q%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // has_balance filter: invoices table vara varai ignore

        return $query->paginate($request->integer('per_page', 25))
            ->through(fn (Customer $c) => $this->format($c));
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->format(Customer::findOrFail($id))]);
    }

    public function lookup(Request $request): JsonResponse
    {
        $request->validate(['mobile' => ['required', 'digits:10']]);

        $customer = Customer::where('mobile', $request->mobile)->first();

        return response()->json(['data' => $customer ? $this->format($customer) : null]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules($request), $this->messages());

        // Same mobile soft-delete aagi irundha restore pannidrom (unique index trashed rows kum varum)
        $existing = Customer::onlyTrashed()->where('mobile', $data['mobile'])->first();

        if ($existing) {
            $existing->restore();
            $existing->update($data);
            $customer = $existing;
        } else {
            $customer = Customer::create($data + ['created_by' => $request->user()->id]);
        }

        return response()->json(['data' => $this->format($customer->fresh())], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);
        $customer->update($request->validate($this->rules($request, $id), $this->messages()));

        return response()->json(['data' => $this->format($customer->fresh())]);
    }

    public function destroy(int $id)
    {
        $customer = Customer::findOrFail($id);

        // Phase 2 la repair_jobs vandhadhum: jobs/invoices irundha 409 kudukkanum
        // if ($customer->jobs()->exists()) {
        //     return response()->json(['message' => 'Customer has jobs or invoices. Deactivate instead.'], 409);
        // }

        $customer->delete();

        return response()->noContent();
    }
}
