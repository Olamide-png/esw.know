<script setup lang="ts">
const props = defineProps<{ title: string; subtitle?: string }>()
</script>


<template>
<section class="space-y-3">
<header>
<h3 class="text-lg font-semibold leading-tight">{{ title }}</h3>
<p v-if="subtitle" class="text-sm text-muted-foreground">{{ subtitle }}</p>
</header>
<div class="prose dark:prose-invert max-w-none">
<slot />
</div>
</section>
</template>