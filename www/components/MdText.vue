<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
const props = withDefaults(defineProps<{ text?: string; inline?: boolean }>(), { text: '', inline: false })
const html = ref('')
let md: any = null

async function render() {
  if (!md) {
    const MarkdownIt = (await import('markdown-it')).default
    md = new MarkdownIt({ linkify: true, breaks: true })
  }
  html.value = props.inline ? md.renderInline(props.text || '') : md.render(props.text || '')
}
onMounted(render)
watch(() => props.text, render)
</script>

<template>
  <div class="prose prose-invert max-w-none" v-html="html"></div>
</template>
