<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <transition enter-active-class="transition-opacity duration-200"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition-opacity duration-150"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[999] bg-black/40"
        :class="overlay ? '' : 'pointer-events-none bg-transparent'"
        @click="onBackdropClick"
      />
    </transition>

    <!-- Panel -->
    <transition
      :enter-active-class="side === 'right'
        ? 'transform transition-transform duration-300'
        : 'transform transition-transform duration-300'"
      :enter-from-class="side === 'right' ? 'translate-x-full' : '-translate-x-full'"
      enter-to-class="translate-x-0"
      :leave-active-class="'transform transition-transform duration-200'"
      leave-from-class="translate-x-0"
      :leave-to-class="side === 'right' ? 'translate-x-full' : '-translate-x-full'"
    >
      <section
        v-if="modelValue"
        ref="panel"
        class="fixed top-0 bottom-0 z-[1000] w-full sm:w-[min(420px,92vw)] md:w-[min(var(--chatbot-width,420px),92vw)] bg-background text-foreground shadow-xl border-l dark:border-neutral-800"
        :class="side === 'right' ? 'right-0' : 'left-0 border-l-0 border-r'"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel"
        @keydown.esc.stop.prevent="escToClose && emitClose()"
      >
        <!-- Header -->
        <header class="flex items-center gap-2 p-3 border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
          <slot name="icon">
            <!-- default tiny avatar -->
            <div class="h-7 w-7 rounded-full border flex items-center justify-center font-semibold">AI</div>
          </slot>
          <h2 class="text-sm font-medium">{{ title }}</h2>
          <div class="ml-auto flex items-center gap-2">
            <button
              v-if="showMinimize"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted"
              @click="emitMinimize"
              aria-label="Minimize chat"
            >
              ▽
            </button>
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted"
              @click="emitClose"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
        </header>

        <!-- Content -->
        <div class="h-[calc(100%-3rem)] overflow-y-auto">
          <slot>
            <!-- Default placeholder content -->
            <div class="p-4 space-y-4">
              <p class="text-sm text-muted-foreground">
                Drop your chatbot UI here. The drawer is fully responsive and dismissible.
              </p>
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">Example message:</p>
                <p class="text-sm mt-1">Hey! Ask me anything about your site.</p>
              </div>
            </div>
          </slot>
        </div>
      </section>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  side?: 'right' | 'left'
  overlay?: boolean
  clickOutsideToClose?: boolean
  escToClose?: boolean
  title?: string
  ariaLabel?: string
  showMinimize?: boolean
}>(), {
  side: 'right',
  overlay: true,
  clickOutsideToClose: true,
  escToClose: true,
  title: 'Chatbot',
  ariaLabel: 'Chatbot',
  showMinimize: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
  (e: 'minimize'): void
}>()

const panel = ref<HTMLElement | null>(null)

const emitClose = () => {
  emit('update:modelValue', false)
  emit('close')
}
const emitMinimize = () => emit('minimize')

const onBackdropClick = (e: MouseEvent) => {
  if (!props.overlay) return
  if (!props.clickOutsideToClose) return
  // Only close if click wasn't inside panel
  if (panel.value && !panel.value.contains(e.target as Node)) {
    emitClose()
  } else if (!panel.value) {
    emitClose()
  }
}
</script>

<style scoped>
/* Optional: tweak width via CSS var anywhere (e.g., :root { --chatbot-width: 480px; }) */
</style>
