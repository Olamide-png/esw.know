---
title: Fixed Pricing
description: Configure fixed pricing models per country through the SFCC Business Manager.
icon: 'lucide:coins'
toc: false
---

::card
---
title: Hybrid Pricing
icon: streamline-ultimate-color:accounting-coins
icon-size: 55
---
The Hybrid Pricing Model combines both Fixed and Calculated Pricing strategies. It allows for a base fixed price to be set, while also enabling dynamic adjustments based on real-time market conditions and FX rates.
::

The Hybrid Pricing Model derives localized prices by combining a retailer’s **default price book value** with dynamic adjustments (FX, uplift, duties, taxes) when rules require it.

## How to Test Hybrid Pricing

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

  Open the order details and verify that the price for the order on the General tab is correct

  #### :smart-icon{name="lucide:settings" size=20 class="align-middle mr-2"} Navigate to Attributes

  Go to the **Attributes** tab and verify that the prices for the order are correct in the ESW Retailer Currency Order Confirmation and ESW Shopper Currency Order Confirmation attributes.
::
