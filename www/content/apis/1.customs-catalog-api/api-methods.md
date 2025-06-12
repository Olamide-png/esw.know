---
title: Customs Catalog API Methods
description: he following methods are included in Customs Catalog API
icon: 'lucide:file-json'
---

### POST/`Upload Catalog`

<br>

<div class="space-y-6 text-base leading-relaxed text-neutral-800 dark:text-neutral-200">

  <p>
    To send catalog information to ESW, submit a
    <code class="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-green-600 font-mono text-sm">
      POST
    </code>
    request to /api/v2/RetailerCatalog
  </p>

  <p>
    The <span class="text-teal-600 font-semibold underline decoration-dotted">ESW Customs Catalog API</span>
    <span class="text-teal-600 ml-1">↗</span> supports the following use cases:
  </p>

  <!-- Use Case 1 -->
  <div>
    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">1. Uploading a Full Catalog</h3>
    <p>
      Recommended when synchronizing your complete product catalog for the first time—usually during onboarding. The file should contain all products you intend to offer.
    </p>
  </div>

  <!-- Use Case 2 -->
  <div>
    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">2. Adding New Products</h3>
    <p>
      If you’ve already submitted your initial catalog, send only the new items you want to add. Existing catalog entries are not affected.
    </p>
  </div>

  <!-- Use Case 3 -->
  <div>
    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">3. Updating Existing Products</h3>
    <p>
      To modify previously submitted products—for example, updating product categories or prices—send only the updated entries. If processed successfully, existing fields in ESW’s system are <span class="font-semibold text-red-600">overwritten</span> with the new values.
    </p>
  </div>

</div>

---

### Minimum Required Parameters

The Customs Catalog API contains certain parameters, which are required at a minimum to correctly identify the items in the catalog. If you submit the API request but do not include these parameters, internal exceptions are created in the ESW system, impacting the overall catalog integration process and product availability.

<div class="overflow-x-auto bg-white dark:bg-neutral-900 p-6 rounded-xl shadow">
  <table class="min-w-full table-auto text-sm text-left text-neutral-800 dark:text-neutral-200">
    <thead class="bg-neutral-100 dark:bg-neutral-800">
      <tr>
        <th class="px-4 py-3 font-semibold">Parameter/Field Name</th>
        <th class="px-4 py-3 font-semibold">Type</th>
        <th class="px-4 py-3 font-semibold">Description</th>
        <th class="px-4 py-3 font-semibold">Notes</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
      <tr>
        <td class="px-4 py-3">productCode</td>
        <td class="px-4 py-3">String (50)</td>
        <td class="px-4 py-3">(Required) The brand's unique master identifier or SKU (Stock Keeping Unit).</td>
        <td class="px-4 py-3">Use the product's SKU where possible. Searchable on retailer’s site. Kept same across checkout and shipping.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">name</td>
        <td class="px-4 py-3">String (150)</td>
        <td class="px-4 py-3">(Required) The name of the product.</td>
        <td class="px-4 py-3">Match product title from landing page. Include distinguishing variant info (e.g., color, size).</td>
      </tr>
      <tr>
        <td class="px-4 py-3">description</td>
        <td class="px-4 py-3">String (100)</td>
        <td class="px-4 py-3">(Required) Short description of the product.</td>
        <td class="px-4 py-3">Used for customs clearance. Provide concise, informative summary.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">material</td>
        <td class="px-4 py-3">String (100)</td>
        <td class="px-4 py-3">(Required) Material composition of the product.</td>
        <td class="px-4 py-3">Include up to 3 materials. Used for customs clearance.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">countryOfOrigin</td>
        <td class="px-4 py-3">CountryIso</td>
        <td class="px-4 py-3">(Required) 2-letter ISO code of manufacturing country.</td>
        <td class="px-4 py-3">E.g., CN, US</td>
      </tr>
      <tr>
        <td class="px-4 py-3">hsCode</td>
        <td class="px-4 py-3">String (12)</td>
        <td class="px-4 py-3">(Required) Product’s HsCode (min. 6 digits).</td>
        <td class="px-4 py-3">Pad with 00 if needed. E.g., 123456 → 12345600</td>
      </tr>
      <tr>
        <td class="px-4 py-3">hsCodeRegion</td>
        <td class="px-4 py-3">Region</td>
        <td class="px-4 py-3">(Required) ESW region related to HsCode.</td>
        <td class="px-4 py-3">E.g., EU, US</td>
      </tr>
      <tr>
        <td class="px-4 py-3">category</td>
        <td class="px-4 py-3">Category</td>
        <td class="px-4 py-3">(Optional) ESW category ID.</td>
        <td class="px-4 py-3">Recommended to include the most relevant category.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">gender</td>
        <td class="px-4 py-3">Gender</td>
        <td class="px-4 py-3">(Optional) Target gender for the product.</td>
        <td class="px-4 py-3">Used for single products with multiple variants.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">ageGroup</td>
        <td class="px-4 py-3">AgeGroup</td>
        <td class="px-4 py-3">(Optional) Target age group for the product.</td>
        <td class="px-4 py-3">Used for single products with multiple variants.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">size</td>
        <td class="px-4 py-3">String (100)</td>
        <td class="px-4 py-3">(Optional) Size of the product.</td>
        <td class="px-4 py-3">Used for single products with multiple variants.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">weight</td>
        <td class="px-4 py-3">Decimal</td>
        <td class="px-4 py-3">(Optional) Weight of the product.</td>
        <td class="px-4 py-3">Required if you specify weight unit.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">weightUnit</td>
        <td class="px-4 py-3">WeightUnit</td>
        <td class="px-4 py-3">(Optional) Unit for product weight.</td>
        <td class="px-4 py-3">Required if you specify weight.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">url</td>
        <td class="px-4 py-3">String (200)</td>
        <td class="px-4 py-3">(Optional) Product landing page URL.</td>
        <td class="px-4 py-3">Start with HTTP/HTTPS. Required for Russia & Japan.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">imageUrl</td>
        <td class="px-4 py-3">String (200)</td>
        <td class="px-4 py-3">(Optional) Product image URL.</td>
        <td class="px-4 py-3">Thumbnail link. Start with HTTP/HTTPS.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">unitPrice</td>
        <td class="px-4 py-3">Decimal</td>
        <td class="px-4 py-3">(Optional) Product price.</td>
        <td class="px-4 py-3">Required if unitPriceCurrencyIso is specified.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">unitPriceCurrencyIso</td>
        <td class="px-4 py-3">CurrencyIso</td>
        <td class="px-4 py-3">(Optional) ISO currency code for price.</td>
        <td class="px-4 py-3">Required if unitPrice is specified.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">dangerousGoods</td>
        <td class="px-4 py-3">Boolean</td>
        <td class="px-4 py-3">(Optional) Whether product is classified as Dangerous Goods.</td>
        <td class="px-4 py-3">Accepted: TRUE or FALSE.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">additionalProductCode</td>
        <td class="px-4 py-3">String (50)</td>
        <td class="px-4 py-3">(Optional) Additional product or manufacturer code.</td>
        <td class="px-4 py-3">Searchable identifier. Consistent across checkout and shipping.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">variantProductCode</td>
        <td class="px-4 py-3">String (50)</td>
        <td class="px-4 py-3">(Optional) Alternate SKU or master identifier.</td>
        <td class="px-4 py-3">Searchable identifier. Consistent across checkout and shipping.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">isRestricted</td>
        <td class="px-4 py-3">Boolean</td>
        <td class="px-4 py-3">(Optional) Indicates global restriction on product.</td>
        <td class="px-4 py-3">Accepted: TRUE or FALSE.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">MID</td>
        <td class="px-4 py-3">String (500)</td>
        <td class="px-4 py-3">(Optional) Manufacturer or shipper ID.</td>
        <td class="px-4 py-3">Required for US-bound shipments over $800.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">MIDAddressZip</td>
        <td class="px-4 py-3">String (500)</td>
        <td class="px-4 py-3">Postal code of manufacturer’s address.</td>
        <td class="px-4 py-3">Required if MID is used and country is China.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">AdditionalInformation</td>
        <td class="px-4 py-3">String (200)</td>
        <td class="px-4 py-3">(Optional) Extra catalog details.</td>
        <td class="px-4 py-3"></td>
      </tr>
      <tr>
        <td class="px-4 py-3">CategoryInformation</td>
        <td class="px-4 py-3">String (200)</td>
        <td class="px-4 py-3">(Optional) Retailer goods/service category info.</td>
        <td class="px-4 py-3"></td>
      </tr>
      <tr>
        <td class="px-4 py-3">IsSubscription</td>
        <td class="px-4 py-3">Boolean</td>
        <td class="px-4 py-3">(Optional) Indicates if product is subscription-based.</td>
        <td class="px-4 py-3">Accepted: TRUE or FALSE.</td>
      </tr>
      <tr>
        <td class="px-4 py-3">IsCustomized</td>
        <td class="px-4 py-3">Boolean</td>
        <td class="px-4 py-3">(Optional) Indicates if product is customized.</td>
        <td class="px-4 py-3">Accepted: TRUE or FALSE.</td>
      </tr>
    </tbody>
  </table>
</div>
