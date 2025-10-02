<template>
  <!-- Outer frame with background layers -->
  <section
    <div class="relative size-[600px] w-full overflow-hidden">
    :class="outerClass"
  >
    <!-- Canvas background -->
    <div class="absolute inset-0 -z-10">
      <ClientOnly>
        <FlickeringGrid
          class="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
          :square-size="squareSize"
          :grid-gap="gridGap"
          :flicker-chance="flickerChance"
          :max-opacity="maxOpacity"
          :color="color"
        />
      </ClientOnly>
      <!-- Optional vignette for contrast -->

    </div>

    <!-- Your original hero content (unchanged API) -->
    <div class="relative mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20 not-prose">
      <NuxtLinkLocale
        v-if="announcement"
        :to="announcement.to"
        :target="announcement.target"
        class="bg-muted inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium"
      >
        <template v-if="announcement.icon">
          <SmartIcon :name="announcement.icon" :size="16" />
          <UiSeparator class="mx-2 h-4" orientation="vertical" />
        </template>
        <span class="sm:hidden">{{ announcement.title }}</span>
        <span class="hidden sm:inline">{{ announcement.title }}</span>
        <Icon name="lucide:arrow-right" class="ml-1 size-4" />
      </NuxtLinkLocale>

      <h1 class="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h1>

      <span class="text-muted-foreground max-w-[750px] text-center text-lg sm:text-xl">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </span>

      <section class="flex w-full items-center justify-center gap-4 py-4 md:pb-10">
        <NuxtLinkLocale
          v-for="(action, i) in actions"
          :key="i"
          :to="action.to"
          :target="action.target"
        >
          <UiButton :variant="action.variant">
            <SmartIcon v-if="action.leftIcon" :name="action.leftIcon" class="mr-1" />
            {{ action.name }}
            <SmartIcon v-if="action.rightIcon" :name="action.rightIcon" class="ml-1" />
          </UiButton>
        </NuxtLinkLocale>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
type Target = '_self' | '_blank' | '_parent' | '_top'

defineProps<{
  announcement?: {
    to?: string
    target?: Target
    icon?: string
    title: string
  }
  actions: Array<{
    name: string
    leftIcon?: string
    rightIcon?: string
    variant?: 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | 'ghost'
    to: string
    target?: Target
  }>

  /** ——— Background tweaks (optional) ——— */
  outerClass?: string            // e.g., 'h-[62vh] md:h-[72vh]'
  color?: string                 // '#22d3ee' | 'rgb(...)' | 'hsl(...)' | 'var(--hero-accent)'
  squareSize?: number            // default 4
  gridGap?: number               // default 8
  flickerChance?: number         // default 0.35 (per second)
  maxOpacity?: number            // default 0.28
}>()

defineSlots()
</script>

<script lang="ts">
export default {
  name: 'Hero',
  props: {
    outerClass: { type: String, default: '' },
    color: { type: String, default: 'var(--hero-accent, #22d3ee)' },
    squareSize: { type: Number, default: 4 },
    gridGap: { type: Number, default: 8 },
    flickerChance: { type: Number, default: 0.35 },
    maxOpacity: { type: Number, default: 0.28 }
  }
}
</script>

<style scoped>
:root { --hero-accent: #22d3ee; }
.dark :root { --hero-accent: #60a5fa; }
</style>

