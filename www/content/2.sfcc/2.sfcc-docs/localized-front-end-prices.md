---
title: Localized Front-End Prices
description: Enhance the localized experience for the shopper by converting front-end prices into localized prices.
icon: 'lucide:receipt-euro'
---

The Localized Front-End Prices feature enhances the shopper experience by dynamically converting static front-end prices into localized values based on the shopper's country and currency. These front-end prices are typically found in **content slots/assets**, and **promotional call-out messages**. <br>

With this feature, your **merchandising team** can display fully localized promotional messages and homepage banners on the storefront without needing to manage separate content per country. This feature not only improves international shopper engagement but also reduces the operational overhead of manual promotions and content localization.

## Benefits

- Automatically localizes hardcoded front-end prices (e.g., "$100") to shopper-specific currencies.

- Displays accurate, converted promotional call-out and banner messages in real time.

- Reduces the need for maintaining multiple versions of assets across ESW-supported markets.

- Increases international conversion rates by promoting local pricing transparently.

## Configuration Requirements

Follow these steps to enable and use this feature:

::steps{:level="5"}
  ##### :smart-icon{name="lucide:settings-2" size=20} Enable the Feature in Site Preferences

  - Navigate to **Merchant Tools → Site Preferences → Custom Site Preferences → ESW Pricing Configuration**
  - Set `ESW Enable Frontend Prices Conversion` = `Yes`

  ##### :smart-icon{name="lucide:file-code" size=20} Use the `esw-price` CSS Class in HTML Elements

  In **promotional call-out messages** or **content assets**, wrap hardcoded prices using HTML elements with the `esw-price class`.
  
  - Ensure that you incorporate the following HTML mark-up to configure Front-end prices in Promotional Call-out Messages and content assets

  ```html [HTML Elements]
  <div class="esw-price">$100</div>
  ```

  You can use any valid HTML tag `<div>`{lang="html"} , `<span>`{lang="html"} , `<p>`{lang="html"} , etc.

  ##### :smart-icon{name="lucide:braces" size=20} Add Optional Data Attributes for Control

  To override country adjustments or rounding behavior, use the following attributes:

  ```html [Attributes]
  <div data-disable-adjustments="true" data-disable-rounding="false" class="esw-price">$100</div>
  ```

  `<div data-disable-adjustments="true"</div>`{lang="html"} disables country-specific pricing adjustments. <br>
  `<div data-disable-rounding="true"</div>`{lang="html"} disables rounding rules.

  ##### :smart-icon{name="lucide:arrow-left-right" size=20} Post-Conversion Behaviour

   Once the ESW plugin converts the price, an additional class is added

   ```html [An additional class is added]
   <div data-disable-adjustments="true" data-disable-rounding="false" class="esw-price esw-price-converted">$100</div>
   ```
   The `esw-price-converted` class can be used for styling or JavaScript hooks after the conversion is complete.
::

### Rounding and Adjustment Behaviour in Front-End Price Conversion

By default, when using the Localized Front-End Prices feature, both rounding rules and country-specific adjustments are applied to the base currency value (e.g., **$100**) using data from the ESW Pricing Advisor.

#### Controlling Adjustment Behaviour with Optional Attributes

If you want to **bypass** rounding or country-specific pricing adjustments, you can do so by adding the following optional data attributes to the HTML element:

`<div data-disable-adjustments="true"</div>`{lang="html"} disables country-specific pricing adjustments. <br>
`<div data-disable-rounding="true"</div>`{lang="html"} Disables price rounding based on configured rules.

You may also selectively disable just one of the behaviors by setting either attribute accordingly.

### Post-Conversion Markup Behaviour

After conversion, the ESW plugin automatically adds the `esw-price-converted` class to the element. This class can be used for **styling**, **tracking**, or **JavaScript-based event handling**.

```html [HTML Example (After Conversion)]
<div data-disable-adjustments="true" data-disable-rounding="false" class="esw-price esw-price-converted">$100</div>
```

### Additional Considerations

- The ESW SFCC Plugin does not apply additional factors such as:
   - Shipping method
   - Shipping cost
   - Country-specific adjustments

As a result, this feature can be safely used for shipping promotion call-out messages and other shipping-related content assets without risk of incorrect price calculation.

- Ensure that prices are configured in the base currency (e.g., USD or EUR).

#### Behavior by Pricing Model

1. **Dynamic/Calculated Pricing Countries** <br>
  Prices are converted from the base currency to the localized currency using ESW Pricing Advisor data, which includes FX rates, rounding rules, and uplift configurations.

2. **Fixed Pricing & ESW Non-Supported Countries** <br>
  The price value remains unchanged, but the localized currency symbol is applied to reflect the shopper’s region.

<div class="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-lg">
<caption class="caption-center text-base font-medium text-neutral-700 dark:text-neutral-300 mb-2">
    </caption>
<img class="w-full h-auto scale-100 hover:scale-140 ease-in duration-500 rounded-xl shadow-lg" src="/image-20210519-101647.png" alt="Features Image">
</div>

<br>

<div class="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-lg">
<caption class="caption-center text-base font-medium text-neutral-700 dark:text-neutral-300 mb-2">
No Conversion for Fixed Model Pricing and ESW Non-Supported Countries
    </caption>
<img class="w-full h-auto scale-100 hover:scale-140 ease-in duration-500 rounded-xl shadow-lg" src="/image-20210519-101706.png" alt="Features Image">
</div>

<br>

<div class="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-lg">
<caption class="caption-center text-base font-medium text-neutral-700 dark:text-neutral-300 mb-2">
Prices Converted for Dynamic/ Calculated Pricing Countries
    </caption>
<img class="w-full h-auto scale-100 hover:scale-140 ease-in duration-500 rounded-xl shadow-lg" src="/image-20210519-101722.png" alt="Features Image">
</div>