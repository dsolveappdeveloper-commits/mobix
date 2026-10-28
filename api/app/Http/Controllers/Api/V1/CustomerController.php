<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    private const SORTABLE = ['name', 'mobile', 'created_at'];

    private function rules(Request $request, ?int $ignoreId = null): array
    {
        $req = $ignoreId ? 'sometimes' : 'required';

        $mobileUnique = Rule::unique('customers')->where('shop_id', $request->user()->shop_id);

        if ($ignoreId) {
            // Update: soft-deleted rows kooda check. Illana DB unique index 500 kudukkum
            $mobileUnique->ignore($ignoreId);
        } else {
            // Create: active mattum check, soft-deleted na store() restore pannum
            $mobileUnique->whereNull('deleted_at');
        }

        return [
            'name' => [$req, 'string', 'max:150'],
            'mobile' => [$req, 'digits:10', $mobileUnique],
            'alt_mobile' => ['nullable', 'digits:10'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'digits:6'],
            'type' => ['sometimes', Rule::in(['retail', 'dealer', 'corporate'])],
            'gstin' => ['nullable', 'string', 'size:15'],
            'dob' => ['nullable', 'date', 'before:today'],
            'notes' => ['nullable', 'string'],
            'marketing_consent' => ['sometimes', 'boolean'],
            'credit_limit' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function messages(): array
    {
        return ['mobile.unique' => 'This mobile number already exists.'];
    }

    // GSTIN uppercase
    private function normalize(Request $request): void
    {
        if ($request->filled('gstin')) {
            $request->merge(['gstin' => strtoupper((string) $request->gstin)]);
        }
    }

    // credit_limit column NOT NULL (default 0), so null vandha 0 aakkurom
    private function payload(array $data): array
    {
        if (array_key_exists('credit_limit', $data) && $data['credit_limit'] === null) {
            $data['credit_limit'] = 0;
        }

        return $data;
    }

    // Jobs/invoices tables varum varai idhu 0/null. Phase 2-3 la real numbers.
    // Technician ku name mattum (spec). Device list Phase 2A devices step la serum.
    private function format(Request $request, Customer $c): array
    {
        if ($request->user()->role->name === 'Technician') {
            return ['id' => $c->id, 'name' => $c->name];
        }

        return array_merge($c->toArray(), [
            'total_jobs' => 0,
            'total_spent' => 0,
            'balance_due' => 0,
            'last_visit' => null,
        ]);
    }

    public function index(Request $request)
    {
        $request->validate([
            'type' => ['nullable', Rule::in(['retail', 'dealer', 'corporate'])],
            'sort' => ['nullable', Rule::in(self::SORTABLE)],
            'dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $query = Customer::query()->orderBy(
            $request->input('sort', 'name'),
            $request->input('dir', 'asc')
        );

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

        $perPage = min($request->integer('per_page', 25), 100);

        return $query->paginate($perPage)
            ->through(fn (Customer $c) => $this->format($request, $c));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return response()->json(['data' => $this->format($request, Customer::findOrFail($id))]);
    }

    public function lookup(Request $request): JsonResponse
    {
        $request->validate(['mobile' => ['required', 'digits:10']]);

        $customer = Customer::where('mobile', $request->mobile)->first();

        return response()->json(['data' => $customer ? $this->format($request, $customer) : null]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->normalize($request);
        $data = $this->payload($request->validate($this->rules($request), $this->messages()));

        // Same mobile soft-delete aagi irundha restore pannidrom (unique index trashed rows kum varum)
        $existing = Customer::onlyTrashed()->where('mobile', $data['mobile'])->first();

        if ($existing) {
            $existing->restore();
            $existing->update($data);
            $customer = $existing;
        } else {
            $customer = Customer::create($data + ['created_by' => $request->user()->id]);
        }

        return response()->json(['data' => $this->format($request, $customer->fresh())], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $this->normalize($request);
        $customer->update($this->payload($request->validate($this->rules($request, $id), $this->messages())));

        return response()->json(['data' => $this->format($request, $customer->fresh())]);
    }

    public function destroy(int $id)
    {
        $customer = Customer::findOrFail($id);

        // repair_jobs / invoices tables vandhadhum thaanaave work aagum
        foreach (['repair_jobs', 'invoices'] as $table) {
            if (Schema::hasTable($table) && DB::table($table)->where('customer_id', $customer->id)->exists()) {
                return response()->json(['message' => 'Customer has jobs or invoices. Deactivate instead.'], 409);
            }
        }

        $customer->delete();

        return response()->noContent();
    }
}
