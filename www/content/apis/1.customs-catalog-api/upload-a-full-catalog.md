---
title: Upload a full catalog
description: Uploading a full catalog
icon: 'lucide:hard-drive-upload'
---

### Upload a full catalog

Uploading a full catalog is recommended only if you are syncing your product catalog for the first time during your onboarding with ESW.

For full catalog uploads, in addition to the parameters listed above, the parameters listed in the following table are also needed. If any of these parameters are not sent in the API request, failure event notifications are sent to ESW Trade Compliance and you might be required to resubmit the product data.

<br>

<div class="overflow-x-auto bg-white dark:bg-neutral-900 p-6 rounded-xl shadow">
  <table class="min-w-full table-auto text-sm text-left text-neutral-800 dark:text-neutral-200">
    <thead class="bg-neutral-100 dark:bg-neutral-800">
      <tr>
        <th class="px-4 py-3 font-semibold">Parameter</th>
        <th class="px-4 py-3 font-semibold">Type</th>
        <th class="px-4 py-3 font-semibold">Description</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
      <tr>
        <td class="px-4 py-3">category</td>
        <td class="px-4 py-3">String</td>
        <td class="px-4 py-3">
          The ESW category ID to which the product should be mapped.<br />
          Example: <code>ApparelClothingNotKnitted</code>
        </td>
      </tr>
      <tr>
        <td class="px-4 py-3">gender</td>
        <td class="px-4 py-3">String</td>
        <td class="px-4 py-3">
          The gender for which the product is intended.<br />
          Example: <code>Female</code>
        </td>
      </tr>
      <tr>
        <td class="px-4 py-3">ageGroup</td>
        <td class="px-4 py-3">String</td>
        <td class="px-4 py-3">
          The age group for which the product is intended.<br />
          Example: <code>Female</code>
        </td>
      </tr>
      <tr>
        <td class="px-4 py-3">size</td>
        <td class="px-4 py-3">String</td>
        <td class="px-4 py-3">
          The size of the product.<br />
          Example: <code>12</code>
        </td>
      </tr>
      <tr>
        <td class="px-4 py-3">weight</td>
        <td class="px-4 py-3">Number</td>
        <td class="px-4 py-3">
          The weight of the product in the associated weightUnit.<br />
          Example: <code>5</code>
        </td>
      </tr>
      <tr>
        <td class="px-4 py-3">weightUnit</td>
        <td class="px-4 py-3">String</td>
        <td class="px-4 py-3">
          The unit in which the weight of the product is calculated.<br />
          Example: <code>Lb</code>
        </td>
      </tr>
      <tr>
        <td class="px-4 py-3">unitPrice</td>
        <td class="px-4 py-3">Object</td>
        <td class="px-4 py-3">
          An object containing the amount and currency parameters.<br />
          <strong>amount</strong> (Number): The amount of the product.<br />
          Example: <code>89.99</code><br />
          <strong>currency</strong> (String): The currency in which the amount is set.<br />
          Example: <code>USD</code>
        </td>
      </tr>
      <tr>
        <td class="px-4 py-3">dangerousGoods</td>
        <td class="px-4 py-3">Boolean</td>
        <td class="px-4 py-3">
          Indicates if the product is classified as a dangerous good or HazMat.<br />
          Accepted values: <code>true</code>, <code>false</code>
        </td>
      </tr>
      <tr>
        <td class="px-4 py-3">additionalProductCode</td>
        <td class="px-4 py-3">String</td>
        <td class="px-4 py-3">
          Additional product code or unique identifier such as manufacturer’s SKU.<br />
          Example: <code>11160296020015</code>
        </td>
      </tr>
      <tr>
        <td class="px-4 py-3">variantProductCode</td>
        <td class="px-4 py-3">String</td>
        <td class="px-4 py-3">
          Another version of the brand's unique master identifier or SKU.<br />
          Example: <code>516165167</code>
        </td>
      </tr>
    </tbody>
  </table>
</div>

### Request Example

The following payload shows parameters that must be sent for all full catalog upload requests.

```json [Required Example] height=150 collapse
[
     {
       "productCode": "11160296020014",
       "name": "JACKET",
       "description": "JACKET",
       "material": "FABRIC 53% cotton, 21% polyester, 21% acrylic, 4% viscose, 1% polyester, lining 100% polyester",
       "countryOfOrigin": "IT",
       "hsCode": "62043290",
       "hsCodeRegion": "EU",
       "category": "ApparelClothingNotKnitted",
       "gender": "Female",
       "ageGroup": null,
       "size": "12",
       "weight": "5",
       "weightUnit": "Lb",
       "unitPrice": {
            "amount": "89.99",
            "currency": "USD"
        },
       "dangerousGoods": "false",
       "additionalProductCode": null,
       "variantProductCode": null
     },
 ]
 ```