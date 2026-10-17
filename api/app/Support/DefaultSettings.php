<?php

namespace App\Support;

class DefaultSettings
{
    // Shop edhuvum maathalana inge irukkura value dhaan use aagum
    public const DEFAULTS = [
        // Job settings
        'job.default_promised_days'  => 2,
        'job.default_warranty_days'  => 30,
        'job.terms'                  => 'Customer is responsible for data backup. The shop is not liable for data loss.',

        // Tax & invoice
        'tax.gst_inclusive'          => false,   // true = prices GST ullatha
        'tax.default_labour_gst'     => 18,
        'tax.labour_sac'             => '998729', // accountant kitta confirm pannanum (spec)
        'tax.round_off'              => true,
        'tax.financial_year_start'   => 4,        // April
        'tax.upi_id'                 => '',
        'tax.invoice_footer'         => '',

        // Inventory
        'inventory.allow_negative_stock' => false,
        'inventory.costing_method'       => 'weighted_average',
        'inventory.low_stock_alert_time' => '09:00',

        // Discounts
        'discount.front_desk_max_pct' => 10,

        // Notifications
        'notify.quiet_start'       => '21:00',
        'notify.quiet_end'         => '08:00',
        'notify.tracking_base_url' => '',

        // Print
        'print.invoice_paper' => 'A4',
        'print.job_sheet_paper' => 'A5',
        'print.label_paper' => '50x25',
    ];

    public static function keys(): array
    {
        return array_keys(self::DEFAULTS);
    }
}
