<script setup lang="ts">
const specUrl = '/openapi.bundle.yaml'
</script>

<template>
  <ClientOnly>
    <!-- CDN load (no build deps) -->
    <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>

    <div class="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-neutral-100">
      <rapi-doc
        spec-url="/openapi.bundle.yaml"
        render-style="read"           
        theme="light"                 
        show-header="false"
        allow-spec-url-load="false"
        allow-spec-file-load="false"
        show-method-in-nav="as-colored-block"
        schema-style="table"
        regular-font="Inter, ui-sans-serif, system-ui"
        mono-font="ui-monospace, SFMono-Regular, Menlo, Monaco"
      ></rapi-doc>
    </div>
  </ClientOnly>
</template>
