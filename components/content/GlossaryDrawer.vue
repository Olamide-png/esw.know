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
  /** The word/phrase shown as the clickable trigger */
  term: string
  /** Optional subtitle shown under the title in the drawer */
  subtitle?: string
  /** Optional: 'right' | 'left' | 'top' | 'bottom' (defaults right) */
  side?: 'right' | 'left' | 'top' | 'bottom'
}>(), {
  side: 'right'
})
</script>

<template>
  <Sheet>
    <!-- Inline trigger that looks like a link with a dotted underline -->
    <SheetTrigger as-child>
      <button
        type="button"
        class="underline decoration-dotted underline-offset-4 text-primary hover:opacity-80 focus:outline-none"
        :aria-label="`Open context for ${props.term}`"
      >
        {{ props.term }}
      </button>
    </SheetTrigger>

    <SheetContent :side="props.side" class="w-full sm:max-w-md">
      <SheetHeader class="mb-2">
        <SheetTitle class="text-base sm:text-lg">{{ props.term }}</SheetTitle>
        <SheetDescription v-if="props.subtitle">{{ props.subtitle }}</SheetDescription>
      </SheetHeader>

      <!-- Your Markdown from the page goes here -->
      <div class="prose dark:prose-invert prose-sm sm:prose-base max-w-none">
        <!-- Use MDCSlot/slot to unwrap <p> wrappers nicely -->
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
