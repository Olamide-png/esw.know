---
title: Calculated Pricing
description: Configure calculated pricing models per country through the SFCC Business Manager.
icon: 'lucide:coins'
toc: false
---

::card
---
title: Calculated Pricing
icon: streamline-ultimate-color:monetization-tablet-dollar
icon-size: 55
---
The Calculated Pricing Model derives localized prices dynamically by converting a retailer’s **default price book value** using a structured pricing formula. <br>
This approach enables flexible and real-time pricing for different countries.
::

The Calculated Pricing Model derives localized prices dynamically by converting a retailer’s **default price book value** using a structured pricing formula.

  <div class="mt-4 bg-cyan-50 border-t-2 border-cyan-500 rounded-xl shadow p-4 dark:bg-cyan-800/30">
    <span class="font-bold">(((Product base price × (1 + priceUpliftPercentage)) × (1 + dutyPercentage)) × (1 + taxPercentage)) × fxRate</span><br>
    <code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-xs font-mono">= Price in the shopper currency → apply rounding = Final product price</code>
  </div>

  <br>

Each component is sourced from the <a href="/apis/pricing-advisor-api/overview" class="underline">Pricing Advisor API ↗</a>:

- Exchange rates (FX)
- Retailer price uplift percentages
- Estimated duty and tax percentages
- Rounding rules

<div class="mt-4 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-lg">
  <p class="caption-center text-base font-medium text-neutral-700 dark:text-neutral-300 mb-2">
    End-to-end flow of calculated pricing
  </p>
  <img class="w-full rounded-xl shadow-lg" src="/image-20210322-100427 (1).png" alt="Calculated pricing flow">
</div>

## Predefined Attributes

- **Retailer Uplift per Country** — e.g., 10% uplift for the U.K.
- **Estimated Taxes per Country**
- **Estimated Duties per Country**
- **Exchange Rate**
- **Rounding Rules**

### Data Sync

  Values are synced daily to:  
  <code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-xs font-mono">Merchant Tools → Site Preferences → Custom Site Preference Groups → eShopWorld Configuration Pricing</code>

<br>

### Example — Calculated price (EUR → DKK)

  <div class="overflow-x-auto bg-white dark:bg-neutral-900 p-4 rounded-xl shadow">
    <table class="min-w-full table-auto text-left text-sm text-neutral-800 dark:text-neutral-200">
      <thead class="bg-neutral-100 dark:bg-neutral-800">
        <tr>
          <th class="px-6 py-3">Parameter</th>
          <th class="px-6 py-3">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr><th class="px-6 py-4 font-medium">Shipping country</th><td class="px-6 py-4">Denmark</td></tr>
        <tr><th class="px-6 py-4 font-medium">Base currency</th><td class="px-6 py-4">EUR</td></tr>
        <tr><th class="px-6 py-4 font-medium">Price book currency</th><td class="px-6 py-4">EUR</td></tr>
        <tr><th class="px-6 py-4 font-medium">Shopper currency</th><td class="px-6 py-4">Danish Krone</td></tr>
        <tr><th class="px-6 py-4 font-medium">Product price in the price book</th><td class="px-6 py-4">EUR 92</td></tr>
        <tr><th class="px-6 py-4 font-medium">Uplift</th><td class="px-6 py-4">3%</td></tr>
        <tr><th class="px-6 py-4 font-medium">Duty</th><td class="px-6 py-4">7%</td></tr>
        <tr><th class="px-6 py-4 font-medium">Tax</th><td class="px-6 py-4">23%</td></tr>
        <tr><th class="px-6 py-4 font-medium">FX Rate (EUR → DKK)</th><td class="px-6 py-4">4.2191</td></tr>
      </tbody>
    </table>
  </div>

  <div class="mt-4 bg-sky-50 border-t-2 border-sky-500 rounded-xl shadow p-4 dark:bg-sky-800/30">
    Final price: <span class="font-bold">DKK 526.18</span><br>
    <code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-xs font-mono">((92 × 1.03) × 1.07 × 1.23) × 4.2191 ≈ 526.18</code>
  </div>


## How to Test Calculated Pricing

### Storefront

::steps{:level="4"}

  #### :smart-icon{name="lucide:mouse-pointer-click" size=20 class="align-middle mr-2"} Open the storefront

  Open the storefront and select a calculated-price model country on the welcome mat.

  #### :smart-icon{name="lucide:binoculars" size=20 class="align-middle mr-2"} Verify prices on Product Listing Page (PLP)

  Verify that the prices on the PLP page, Quick View modal, PDP page, mini cart modal, cart page, and checkout page are calculated according to the data from the Pricing Advisor.
::

### Business Manager

::steps{:level="4"}

  #### :smart-icon{name="lucide:dollar-sign" size=20 class="align-middle mr-2"} Verify Currency

  Verify that the currency of the order in the order listing table is the default currency (e.g., USD).

  #### :smart-icon{name="lucide:receipt" size=20 class="align-middle mr-2"} Verify Price

  Open the order details and verify that the price for the order on the General tab is correct.

  #### :smart-icon{name="lucide:settings" size=20 class="align-middle mr-2"} Navigate to Attributes

  Go to the **Attributes** tab and verify that the prices for the order are correct in the ESW Retailer Currency Order Confirmation and ESW Shopper Currency Order Confirmation attributes.
::


