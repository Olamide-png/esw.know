<script setup lang="ts">
const saved = localStorage.getItem(props.persistKey)
if (saved) index.value = Number(saved)
})


watch(index, (val) => {
if (props.persistKey) localStorage.setItem(props.persistKey, String(val))
emit('change', val)
})


const current = computed(() => props.steps[index.value])
const isFirst = computed(() => index.value === 0)
const isLast = computed(() => index.value === props.steps.length - 1)


function next() {
if (!isLast.value) index.value += 1
else emit('finish')
}
function prev() {
if (!isFirst.value) index.value -= 1
}
</script>


<template>
<div class="w-full max-w-4xl mx-auto">
<!-- Progress -->
<div class="mb-6">
<div class="flex items-center justify-between text-sm text-muted-foreground">
<span>{{ index + 1 }} / {{ steps.length }}</span>
<span>{{ current?.title }}</span>
</div>
<div class="h-2 mt-2 bg-muted rounded-full overflow-hidden">
<div
class="h-full bg-primary transition-all"
:style="{ width: `${((index + 1) / steps.length) * 100}%` }"
/>
</div>
</div>


<!-- Slot so each step can render rich content (code, checks, etc.) -->
<div class="rounded-2xl border bg-card text-card-foreground shadow-sm p-5 md:p-6">
<slot :step="current" :index="index" />
</div>


<!-- Controls -->
<div class="flex items-center justify-between mt-4 gap-4">
<button
class="px-3 py-2 rounded-xl border hover:bg-muted disabled:opacity-50"
:disabled="isFirst"
@click="prev"
>
Back
</button>
<button
class="px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90"
@click="next"
>
{{ isLast ? 'Finish' : 'Next' }}
</button>
</div>
</div>
</template>