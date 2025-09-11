<script setup lang="ts">
const props = withDefaults(defineProps<{
  rows: { enabled: boolean; key: string; value: string }[],
  addLabel?: string
}>(), { addLabel: 'Add' })

const emit = defineEmits(['update:rows'])

function addRow() {
  emit('update:rows', [...props.rows, { enabled: true, key: '', value: '' }])
}
function delRow(i: number) {
  const next=[...props.rows]; next.splice(i,1); emit('update:rows', next)
}
function setRow(i:number, patch: Partial<{enabled:boolean;key:string;value:string}>) {
  const next=[...props.rows]; next[i] = { ...next[i], ...patch }; emit('update:rows', next)
}
</script>

<template>
  <div class="space-y-2">
    <div v-for="(r,i) in rows" :key="i" class="grid grid-cols-[auto,1fr,1fr,auto] items-center gap-2">
      <input type="checkbox" :checked="r.enabled"
             @change="setRow(i,{enabled:($event.target as HTMLInputElement).checked})" />
      <input class="border rounded px-2 py-1 text-sm font-mono" :value="r.key" placeholder="key"
             @input="setRow(i,{key:($event.target as HTMLInputElement).value})">
      <input class="border rounded px-2 py-1 text-sm font-mono" :value="r.value" placeholder="value"
             @input="setRow(i,{value:($event.target as HTMLInputElement).value})">
      <button class="text-xs text-destructive" @click="delRow(i)">Remove</button>
    </div>
    <button class="text-sm underline" @click="addRow">+ {{ addLabel }}</button>
  </div>
</template>
