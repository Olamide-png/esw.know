---
title: Localized Front-End Prices
description: Enhance the localized experience for the shopper by converting front-end prices into localized prices.
icon: 'lucide:receipt-euro'
---

The Localized Front-End Prices feature enhances the shopper experience by dynamically converting static front-end prices into localized values based on the shopper's country and currency. These front-end prices are typically found in **content slots**, **assets**, and **promotional call-out messages**. <br>

With this feature, your **merchandising team** can display fully localized promotional messages and homepage banners without needing to manage separate content per country. This automation not only improves international shopper engagement but also reduces the operational overhead of manual content localization.

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

  ```html [HTML Elements]
  <div class="esw-price">$100</div>
  ```

  You can use any valid HTML tag `<div>`{lang="html"} , `<span>`{lang="html"} , `<p>`{lang="html"} , etc.

  ##### :smart-icon{name="braces" size=20} Add Optional Data Attributes for Control

  To override country adjustments or rounding behavior, use the following attributes:

  ```html [Attributes]
  <div data-disable-adjustments="true" data-disable-rounding="false" class="esw-price">$100</div>
  ```

  `<div data-disable-adjustments="true"</div>`{lang="html"} disables country-specific pricing adjustments. <br>
  `<div data-disable-rounding="true"</div>`{lang="html"} disables rounding rules.

  ##### :smart-icon{name="arrow-left-right" size=20} Post-Conversion Behaviour

   Once the ESW plugin converts the price, an additional class is added

   ```html [An additional class is added]
   <div data-disable-adjustments="true" data-disable-rounding="false" class="esw-price esw-price-converted">$100</div>
   ```
   The `esw-price-converted` class can be used for styling or JavaScript hooks after the conversion is complete.
::

### Additional Considerations

- This feature **does not apply** country, shipping method, cost, or shipping-related adjustments.
- It is ideal for use in shipping promotions, home banners, or static promotional content.
- Ensure that static prices are configured using the base currency.
- For:
  - Calculated Pricing Countries: Conversion is based on ESW Pricing Advisor FX data.
  - Fixed Pricing or ESW Non-Supported Countries: The value remains unchanged, but the currency symbol is localized.
