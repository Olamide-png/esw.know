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

  ![](/Screenshot2025-07-07095215.png){lifted}

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


## Multiple FX Rates Pricing

The Multiple FX Rates Pricing feature provides country-level control over pricing conversions, allowing you to define multiple base and settlement currencies across different regions. <br>

Instead of relying on a global default base currency (e.g., USD), this feature enables the cartridge to apply country-specific base currencies and convert prices using the corresponding FX rate.

> If you want to convert prices for Germany using GBP as the base currency instead of USD, you can set `GBP` as the `baseCurrency` for Germany in the ESW Countries custom object.

## Configuration Requirements

To enable and use this feature, ensure the following conditions are met:

- Enable Multiple FX Rates
    Set the custom site preference
    `ESW Enable Multiple FX Rates` to Yes (Located under ESW Pricing Configuration)

  - Define Country Base Currency
    Set the `baseCurrency` attribute for each required country in the ESW Countries custom object.

  - Ensure Price Book Availability
    The base currency price book must be:
    - Online
    - Available
    -Assigned to the site

  - Verify Currency Allowance
    Confirm the base currency exists under allowed currencies:
    **Merchant Tools → Site Preferences → Currencies**

This configuration allows the ESW-SFCC cartridge to apply the correct FX rate dynamically, supporting accurate, localized pricing based on shopper or billing country.

## Rounding Prices

The **ESW-SFCC cartridge**{style="color: tomato"} enables merchants to control how prices are displayed across the storefront, shopping cart, and ESW Checkout by configuring the **ESW Rounding Rules**. <br>

These rules apply only to countries and currencies that use the **Calculated Pricing Model**.

## Implement Rounding Rules

Rounding behavior is configured within Salesforce B2C Commerce Business Manager. To define or modify rounding rules: <br>

Navigate to <code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 text-xs font-JetBrains Mono">Merchant Tools → Custom Objects → Custom Object Editor → ESW_PA_DATA → ESW Rounding Rules </code>

Once configured, these rules will be applied automatically to all prices calculated via the ESW Pricing Advisor, ensuring consistent price presentation across the shopper journey.

<br>

<p class="text-center">ESW Rounding Rules.</p>

<div>
<img class="w-full rounded-xl shadow-lg" src="/Screenshot 2025-07-07 111807.png" alt="Features Image">
</div>

<br>

<div>
<img class="w-full rounded-xl shadow-lg" src="/Screenshot 2025-07-07 114136.png" alt="Features Image">
</div>

<br>

### How Rounding Rules Are Applied

The ESW Rounding Rules are automatically applied to the appropriate country and currency after the `retailerPricingFeed` job is executed. <br>

Below is a sample payload structure illustrating how rounding rules are assigned per country and currency:

```json
{
  "deliveryCountryIso": "GB",
  "roundingModels": [
    {
      "currencyIso": "GBP",
      "currencyExponent": 2,
      "direction": "Up",
      "model": "none.fixed99"
    }
  ]
},
{
  "deliveryCountryIso": "JP",
  "roundingModels": [
    {
      "currencyIso": "JPY",
      "currencyExponent": 0,
      "direction": "Nearest",
      "model": "multiple1000.none"
    }
  ]
}
```
<br>

::field-group
  ::field{name="deliveryCountryIso" type="string" required}
  ISO code of the shopper’s delivery country.
  ::

  ::field{name="currencyIso" type="string" required}
  Currency to which the rounding rule applies.  e.g., `GBP`, `JPY`
  ::

  ::field{name="currencyExponent" type="integer" required}
  Number of decimal places used e.g., `2` for GBP
  ::

  ::field{name="direction" type="enum" values="Up, Down, Nearest" required}
  Rounding direction `Up`, `Down`, `Nearest`
  ::

  ::field{name="model" type="string" required}
  Indicates the rounding model that will be applied to product price within ESW Rounding Methods e.g., `Fixed`, `Multiple`, and `None`. For the `multiple1000.none` or `none.fixed99` rounding models, the rounding methods are `Fixed`, `Multiple` and `None`
  ::
::

**Multiple Currency Rounding Rules per Country**

```json
{
  "deliveryCountryIso": "FR",
  "roundingModels": [
    {
      "currencyIso": "EUR",
      "currencyExponent": 2,
      "direction": "Up",
      "model": "none.none"
    },
    {
      "currencyIso": "GBP",
      "currencyExponent": 2,
      "direction": "Down",
      "model": "none.fixed99"
    }
  ]
}
```

## Model Rules

The following model rules govern how price values are adjusted based on the relationship between the currency exponent and the number of digits defined in the rounding model:

**Truncate**

If the number of digits in the rounding model exceeds the number of digits allowed by the currency exponent, the extra digits are truncated. <br>

**Extend**

If the currency exponent allows more digits than the rounding model specifies, the model is extended with trailing zeros.

<br>

**Parameters and Values**

| Parameter                         | Value   |
|-----------------------------------|---------|
| Shipping country                  | France  |
| Base currency                     | EUR     |
| Price book currency               | EUR     |
| Shopper currency                  | GBP     |
| Product price in the price book   | EUR 100 |
| Uplift                            | 3%      |
| Duty                              | 7%      |
| Tax                               | 20%     |
| FX Rate (EUR – GBP)               | 0.8313  |

<br>

Based on these values, the calculated price will be `109.9410876` GBP.

Calculated as: Price of product in price book x Uplift x Duty x Tax x FX rate <br>
= `100 x 1.03 x 1.07 x 1.2 x 0.8313` <br>
= `109.9410876`.

ESW rounding rules applied to the calculated price.

## Rounding rules and examples

### Rounding Method: `none`

```json
{"currencyIso":"GBP","currencyExponent":2,"direction":"Up","model":"none.none"}
```
<br>

Based on this, `109.9410876` GBP is displayed as `109.94` GBP on the storefront.


### Rounding Method: `fixed`

```json
{"currencyIso":"GBP", "currencyExponent":2, "direction":"Up", "model":"none.fixed25"}
```

Based on this, `109.9410876` GBP is displayed as `110.25` GBP on the storefront, and the shipping cost `27.49` is displayed as `28.25` GBP in the cart.

### Rounding Method: `multiple`

```json
{"currencyIso":"JPY","currencyExponent":0,"direction":"Nearest","model":"multiple1000.none"}
```

When the `multiple1000` rounding logic is applied, ``14713/1000 = 14.7 > Nearest > 15 > 15 x 1000`` <br>
= `15000`

> The difference in product prices before and after the rounding model is applied is recorded at the order product line item level as the **ESW Delta Rounding Value**.

## ESW Rounding Rules Matrix

| Currency Exponent | Direction | Exponent Rounding (Fixed) | Exponent Rounding (Multiple) | Exponent Rounding (None) | Whole Number Rounding (Fixed) | Whole Number Rounding (Multiple) | Whole Number Rounding (None) |
|---|---|---|---|---|---|---|---|
| 0 | Up      | N/A       | N/A       | N/A       | Supported | Supported | Supported |
| 0 | Down    | N/A       | N/A       | N/A       | Supported | Supported | Supported |
| 0 | Nearest | N/A       | N/A       | N/A       | Supported | Supported | Supported |
| 2 | Up      | Supported | Supported | Supported | Supported | Supported | Supported |
| 2 | Down    | Supported | Supported | Supported | Supported | Supported | Supported |
| 2 | Nearest | Supported | Supported | Supported | Supported | Supported | Supported |