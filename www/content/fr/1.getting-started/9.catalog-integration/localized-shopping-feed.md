---
title: Localized Shopping Feed Integration
description:  Generate customized feed files for specific countries and marketplaces.
icon: 'lucide:shopping-bag'
toc: true
---

The Localized Shopping Feed Job is a powerful feature that allows retailers to generate customized product feed files for specific countries and marketplaces. It ensures that your product listings are:

- Compliant with local regulations

- Aligned with marketplace-specific standards

- Optimized for regional marketing efforts

## Key Benefits

- **Localization:** Tailor feeds by country, currency, language, or regulatory need

- **Compliance:** Automatically include required attributes per region (e.g., HS code, COO, pricing formats)

- **Efficiency:** Automates generation and download of localized feeds via a scheduled SFCC job

- **Marketplace Ready:** Prepares listings in the expected format for platforms like Google Shopping, Meta, and others

### Output Location

Once executed, the job generates feed files in the following location:

```swift
/IMPEX/src/esw/localizedfeeds/
```
Files can be downloaded directly from this folder via Business Manager or external automation tools.

### Use Cases

- Generate US-specific product feeds with imperial weight units and USD pricing

- Create EU-compliant listings including HS codes and eco-tax data

- Build localized Google Shopping feeds with language- and market-specific adjustments

## How to Test Localized Shopping Feed Job

Follow these steps to test the localized shopping feed job in your SFCC instance:

::steps{:level="4"}

#### :smart-icon{name="twemoji:world-map" size=55} Enable Country-Level Support  

- Navigate to **Merchant Tools > Custom Objects > ESW_COUNTRIES**
- Open the relevant country record.
- Enable the checkbox: **Is Localized Shopping Feed Supported?**


#### :smart-icon{name="streamline-ultimate-color:products-gifts" size=55} Enable Product-Level Support  

- Go to the product(s) you wish to include in the feed.
- Set the following attribute **ESW Localized Shopping Product = true**

#### :smart-icon{name="streamline-ultimate-color:tags-settings" size=55} Configure Feed Settings  

- Navigate to **Merchant Tools > Custom Preferences > ESW Localized Shopping Feed Configuration**
- Set up all required configurations.

::div{class="p-4"}
![No Zooming Image](/e92c739c-365f-4879-beae-aaa7604e2aae (1) (1).png){:zoom="true"}
::

#### :smart-icon{name="streamline-ultimate-color:server-star-1" size=55} Set Product Attribute Mapping  

- Add the custom field mappings using the following JSON structure:

```json
{
  "material": "eswMaterial",
  "countryOfOrigin": "eswCountryOfOrigin",
  "hsCode": "eswHsCode",
  "hsCodeRegion": "eswHsCodeRegion"
}
```

#### :smart-icon{name="streamline-emojis:robot-face-3" size=55} Run the Feed Job  

- Navigate to:  
  **Administration > Jobs**
- Run the following job:  
  **eswLocalizedShoppingFeed**


#### :smart-icon{name="streamline-ultimate-color:check-badge" size=55} Validate the Generated Feed  

- Navigate to the following path:  
  **/Impex/src/shopping-feeds/**
- Download the generated feed file.
- Open and verify that the feed content matches expected values.
::
