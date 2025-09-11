<script setup lang="ts">
const model = defineModel<string>({ default: '' })

function format() {
  try { model.value = JSON.stringify(JSON.parse(model.value || 'null'), null, 2) } catch {}
}
function minify() {
  try { model.value = JSON.stringify(JSON.parse(model.value || 'null')) } catch {}
}
function sample() { model.value ||= '{\n  "example": true\n}' }
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2 text-xs">
      <button class="underline" @click="format">Format</button>
      <button class="underline" @click="minify">Minify</button>
      <button class="underline" @click="sample">Sample</button>
    </div>
    <textarea v-model="model" class="w-full min-h-[220px] font-mono text-sm rounded border p-2"
              spellcheck="false" />
  </div>
</template>
