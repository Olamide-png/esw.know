---
title: Customs Catalog API Methods
description: To send the catalog information to ESW, send a POST request to /api/v2/RetailerCatalog
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
    request to `/api/v2/RetailerCatalog`
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