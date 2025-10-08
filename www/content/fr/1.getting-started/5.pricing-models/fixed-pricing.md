---
title: Fixed Pricing
description: Configure fixed pricing models per country through the SFCC Business Manager.
icon: 'lucide:coins'
toc: false
---

::card
---
title: Fixed Pricing
icon: streamline-ultimate-color:cash-payment-coin-dollar
icon-size: 50
---
A Fixed pricing model is a localized price that is not dynamically converted based on real-time foreign exchange (FX) rates. This price is taken directly from the standard price books in Salesforce B2C Commerce and used as-is.
::

## Conditions for Using Fixed Pricing Model

  - Configure in Site Preferences: `ESW Fixed List PriceBook Pattern`, `ESW Fixed Sale PriceBook Pattern`.
  - Matching Fixed Price Books must exist and include valid product price assignments.
  - Books considered for fixed pricing must be **active** and **indexed**.

## Requirements

### Single Fixed Price Display

  Shown when:
  - Only one fixed price exists (list or sale), **or**
  - Only one Fixed Price Book is configured and it has a valid price assignment.

### Site Assignment Restriction

  Fixed Price Books must **not** be assigned to any Site (assigned books are treated as regular price books and excluded from fixed rendering).

### Currency and Price Book Setup

  - Add non-default currencies in SFCC for in-country fixed prices.
  - Orders are stored using that currency.
  - Welcome Mat currency selection disabled; default comes from **ESW Countries**.
  - Enable **Is Fixed Price Model** on the country.

## How to Test Fixed Pricing

### Storefront

::steps{:level="4"}

  #### :smart-icon{name="lucide:mouse-pointer-click" size=20 class="align-middle mr-2"} select a fixed-price model country

  Open the storefront and select a fixed-price model country on the welcome mat.

  #### :smart-icon{name="lucide:binoculars" size=20 class="align-middle mr-2"} Verify prices on Product Listing Page (PLP)

  Navigate to a PLP page and verify that the prices on the page are the same as in the price book for the country.

  #### :smart-icon{name="lucide:telescope" size=20 class="align-middle mr-2"} Verify price on Quick View

  Open the Quick View modal for a product on the PLP page and verify that the prices on the Quick View are the same as in the price book.

  #### :smart-icon{name="lucide:monitor-cog" size=20 class="align-middle mr-2"} Verify price on Product Details Page (PDP)

  Open a PDP page for a product and verify that the prices on the PDP page are the same as in the price book.

  #### :smart-icon{name="lucide:shopping-cart" size=20 class="align-middle mr-2"} Add a product to the cart

  Add a product to the cart and open the mini cart modal. Verify that the prices for the product are the same as in the price book.

  #### :smart-icon{name="lucide:shopping-basket" size=20 class="align-middle mr-2"} Navigate to the basket page

  Open the basket page and verify that the prices for the product are the same as in the price book.

  #### :smart-icon{name="lucide:credit-card" size=20 class="align-middle mr-2"} Proceed to checkout

  Proceed to checkout and verify that the prices for the product are the same as in the price book.

  #### :smart-icon{name="lucide:credit-card" size=20 class="align-middle mr-2"} Place an order

  Complete the checkout process and place an order.
::

### Business Manager

::steps{:level="4"}

  #### :smart-icon{name="lucide:briefcase-business" size=20 class="align-middle mr-2"} Navigate to Business Manager

  Navigate to Business Manager and find your order.

  #### :smart-icon{name="lucide:dollar-sign" size=20 class="align-middle mr-2"} Verify Currency

  Verify that the order currency in the listing table is the same as the shopper currency for the country.

  #### :smart-icon{name="lucide:receipt" size=20 class="align-middle mr-2"} Open the order

  Open the order details and verify that the price for the order on the General tab is correct

  #### :smart-icon{name="lucide:settings" size=20 class="align-middle mr-2"} Navigate to Attributes

  Go to the **Attributes** tab and confirm that the order prices are accurate in the ESW Retailer Currency
::

## Fallback Scenario  

**When Product Price is not available in the Fixed price book**

- If the price of a product is not available in the fixed price book and the Fx Rate is not available from retailer currency to shopper currency, `null` (or `N/A`) will be shown. 
- If an FX rate is available, the final price shown to the shopper is calculated by converting the product price from the price book currency to the shopper's currency using the applicable exchange rate.

For example, if the product price in the price book is **EUR 92**, the shopper currency is **PLN**, and the exchange rate (`EUR → PLN`) is **4.2191**, the calculation is:

```
Final price = EUR 92 × 4.2191 = PLN 388.16
```

The shopper will see a final price of **PLN 388.16**.

![](/2(1).png){lifted}

<br>

::GlossaryDrawer{term="Fixed Pricing Model Example A" subtitle="Example"}
Example A — Fixed price with price book override, no FX
Price from the price book: **GBP 201.60**.

  <div class="overflow-x-auto bg-white dark:bg-neutral-900 p-4 rounded-xl shadow">
    <table class="min-w-full table-auto text-left text-sm text-neutral-800 dark:text-neutral-200">
      <thead class="bg-neutral-100 dark:bg-neutral-800">
        <tr>
          <th class="px-6 py-3">Parameter</th>
          <th class="px-6 py-3">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr><th class="px-6 py-4 font-medium">Shipping country</th><td class="px-6 py-4">United Kingdom</td></tr>
        <tr><th class="px-6 py-4 font-medium">Base currency</th><td class="px-6 py-4">USD</td></tr>
        <tr><th class="px-6 py-4 font-medium">Price book currency</th><td class="px-6 py-4">GBP</td></tr>
        <tr><th class="px-6 py-4 font-medium">Shopper currency</th><td class="px-6 py-4">GBP</td></tr>
      </tbody>
    </table>
  </div>

  <div class="mt-4 bg-teal-50 border-t-2 border-teal-500 rounded-xl shadow p-4 dark:bg-teal-800/30">
    Final price displayed: <span class="font-bold">GBP 201.60</span> (taken from GBP price book as-is).
  </div>

  <br>

  ![](/Screenshot2025-07-04132743_PhotoGrid.png){lifted}
  </div>
::
  
::GlossaryDrawer{term="Fixed Pricing Model Example B" subtitle="Example B"}
Example B — Fixed price without override, with FX
Price in price book: **EUR 92**, Shopper currency: **PLN**.

  <div class="overflow-x-auto bg-white dark:bg-neutral-900 p-4 rounded-xl shadow">
    <table class="min-w-full table-auto text-left text-sm text-neutral-800 dark:text-neutral-200">
      <thead class="bg-neutral-100 dark:bg-neutral-800">
        <tr>
          <th class="px-6 py-3">Parameter</th>
          <th class="px-6 py-3">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr><th class="px-6 py-4 font-medium">Shipping country</th><td class="px-6 py-4">Poland</td></tr>
        <tr><th class="px-6 py-4 font-medium">Base currency</th><td class="px-6 py-4">EUR</td></tr>
        <tr><th class="px-6 py-4 font-medium">Price book currency</th><td class="px-6 py-4">EUR</td></tr>
        <tr><th class="px-6 py-4 font-medium">Shopper currency</th><td class="px-6 py-4">PLN</td></tr>
        <tr><th class="px-6 py-4 font-medium">Product price in the price book</th><td class="px-6 py-4">EUR 92</td></tr>
        <tr><th class="px-6 py-4 font-medium">FX Rate (EUR → PLN)</th><td class="px-6 py-4">4.2191</td></tr>
      </tbody>
    </table>
  </div>

  <div class="mt-4 bg-teal-50 border-t-2 border-teal-500 rounded-xl shadow p-4 dark:bg-teal-800/30">
    Final price: <span class="font-bold">PLN 388.16</span><br>
    <code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-xs font-mono">EUR 92 × 4.2191 = PLN 388.16</code>
  </div>

  ![](/Screenshot2025-07-04143837.png){lifted}
  </div>
::