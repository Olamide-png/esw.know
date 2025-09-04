<script setup lang="ts">
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"

const props = withDefaults(defineProps<{
  term: string
  subtitle?: string
  side?: 'right' | 'left' | 'top' | 'bottom'
  /** md ~ 560px, lg ~ 640px, xl ~ 768px, 2xl ~ 896px, 3xl ~ 1024px */
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  /** Extra classes for the content wrapper (optional) */
  contentClass?: string
}>(), {
  side: 'right',
  size: 'xl'
})

/** Map sizes to responsive max widths */
const sizeClass = {
  md:  'w-full sm:max-w-md',
  lg:  'w-full sm:max-w-lg',
  xl:  'w-full sm:max-w-xl',
  '2xl':'w-full sm:max-w-2xl',
  '3xl':'w-full sm:max-w-3xl'
}[props.size]
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <button
        type="button"
        class="underline decoration-dotted underline-offset-4 text-primary hover:opacity-80 focus:outline-none"
        :aria-label="`Open context for ${props.term}`"
      >
        {{ props.term }}
      </button>
    </SheetTrigger>

    <!-- Theme-aware, wider drawer -->
    <SheetContent
      :side="props.side"
      :class="[
        sizeClass,
        // Ensure it inherits theme variables from shadcn
        'bg-background text-foreground border-l',
        // Let pages add more classes if needed
        props.contentClass
      ]"
    >
      <SheetHeader class="mb-2">
        <SheetTitle class="text-base sm:text-lg">{{ props.term }}</SheetTitle>
        <SheetDescription v-if="props.subtitle">{{ props.subtitle }}</SheetDescription>
      </SheetHeader>

      <div class="prose dark:prose-invert prose-sm sm:prose-base max-w-none">
        <slot />
      </div>

      <div class="mt-6 flex justify-end">
        <SheetClose as-child>
          <button
            type="button"
            class="px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
          >
            Close
          </button>
        </SheetClose>
      </div>
    </SheetContent>
  </Sheet>
</template>

