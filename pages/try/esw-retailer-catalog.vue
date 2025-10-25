<script setup lang="ts">
import TryItConsole from '~/www/components/TryItConsole.vue'

const environments = [
  { label: 'UAT — https://logistics.example.com', baseUrl: 'https://logistics.example.com' },
  { label: 'Prod — https://api.example.com', baseUrl: 'https://api.example.com' },
]

const exampleBody = `[
  {
    "productCode": "string",
    "name": "string",
    "description": "string",
    "material": "string",
    "countryOfOrigin": "AD",
    "hsCode": "string",
    "hsCodeRegion": "AD",
    "parentProductCode": "string",
    "category": "AnimalPetSupplies",
    "subCategory": "PetSupplies"
  }
]`
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <TryItConsole
      title="Allows a retailer to upload a catalog that will be subject to validation processing."
      method="POST"
      path="/api/v2/RetailerCatalog"
      :environments="environments"
      auth="bearer"
      :contentTypes="['application/json','application/json-patch+json']"
      :defaultHeaders="{ Accept: 'application/json' }"
      :defaultQuery="{}"
      :examplePicker="{ 'Sample payload': exampleBody }"
      :defaultBody="exampleBody"
    />
  </div>
</template>
