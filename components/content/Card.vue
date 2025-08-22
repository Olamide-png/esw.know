<template>
  <UseTemplate>
    <UiCard
      ref="cardEl"
      class="relative h-full overflow-hidden transition-all spotlight-card"
      :class="[
        to && 'hover:bg-muted',
        inStack && 'mb-0 rounded-none border-none shadow-none',
      ]"
      @mousemove="updateSpotlight"
      @mouseleave="resetSpotlight"
    >
      <NuxtImg
        v-if="img"
        :src="img"
        class="w-full"
      />

      <UiCardHeader
        v-if="icon || title || $slots.title || description || $slots.description"
        :class="{ 'flex-row items-center gap-5': horizontal }"
      >
        <SmartIcon v-if="icon" :name="icon" :size="iconSize" :class="{ 'mb-2': !horizontal }" />
        <div class="flex flex-col gap-1.5">
          <UiCardTitle v-if="title || $slots.title">
            <ContentSlot :use="$slots.title" unwrap="p" />
            {{ title }}
          </UiCardTitle>
          <UiCardDescription v-if="description || $slots.description">
            <ContentSlot :use="$slots.description" unwrap="p" />
            {{ description }}
          </UiCardDescription>
        </div>
      </UiCardHeader>

      <UiCardContent v-if="content || $slots.content || $slots.default">
        <ContentSlot :use="$slots.content" unwrap="p" />
        <ContentSlot unwrap="p" />
      </UiCardContent>

      <UiCardFooter v-if="footer || $slots.footer">
        <ContentSlot :use="$slots.footer" unwrap="p" />
        {{ footer }}
      </UiCardFooter>

      <SmartIcon v-if="to && showLinkIcon" name="lucide:arrow-up-right" class="absolute right-4 top-4" />
    </UiCard>
  </UseTemplate>

  <div class="group-has-[div]:!mt-0 [&:not(:first-child)]:mt-5">
    <NuxtLinkLocale v-if="to" :to :target>
      <CardInner />
    </NuxtLinkLocale>
    <CardInner v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

// Props (unchanged)
const {
  showLinkIcon = true,
  horizontal = false,
  iconSize = 24,
} = defineProps<{
  title?: string;
  description?: string;
  footer?: string;
  content?: string;
  to?: string;
  target?: Target;
  icon?: string;
  iconSize?: number;
  inStack?: boolean;
  img?: string;
  showLinkIcon?: boolean;
  horizontal?: boolean;
}>();

defineSlots();

const [UseTemplate, CardInner] = createReusableTemplate();

// Spotlight refs/observers
const cardEl = ref<HTMLElement | null>(null);
let htmlObserver: MutationObserver | null = null;
let cardObserver: MutationObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;

// If you use @nuxtjs/color-mode, this will exist; safe-guarded for SSR
const colorMode = (process.client && typeof useColorMode === 'function') ? useColorMode() : null;

const setSpotColor = () => {
  if (!cardEl.value) return;
  // Inherit from computed background color (bg-primary, dark:bg-*, etc.)
  const bg = getComputedStyle(cardEl.value).backgroundColor;
  cardEl.value.style.setProperty('--spot-color', bg);
};

const scheduleSetSpotColor = () => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(setSpotColor);
};

const updateSpotlight = (event: MouseEvent) => {
  const el = event.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100 + '%';
  const y = ((event.clientY - rect.top) / rect.height) * 100 + '%';
  el.style.setProperty('--spot-x', x);
  el.style.setProperty('--spot-y', y);
};

const resetSpotlight = (event: MouseEvent) => {
  const el = event.currentTarget as HTMLElement;
  el.style.setProperty('--spot-x', '50%');
  el.style.setProperty('--spot-y', '50%');
};

onMounted(() => {
  setSpotColor();

  // React to color-mode changes
  if (colorMode) {
    watch(() => colorMode.value, scheduleSetSpotColor, { flush: 'post' });
  }

  // Also watch <html> class changes (e.g., 'dark' toggled)
  htmlObserver = new MutationObserver(scheduleSetSpotColor);
  htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // Watch this card for class/style changes that affect background
  if (cardEl.value) {
    cardObserver = new MutationObserver(scheduleSetSpotColor);
    cardObserver.observe(cardEl.value, { attributes: true, attributeFilter: ['class', 'style'] });

    resizeObserver = new ResizeObserver(scheduleSetSpotColor);
    resizeObserver.observe(cardEl.value);
  }
});

onBeforeUnmount(() => {
  if (htmlObserver) htmlObserver.disconnect();
  if (cardObserver) cardObserver.disconnect();
  if (resizeObserver) resizeObserver.disconnect();
  if (rafId) cancelAnimationFrame(rafId);
});
</script>

<style scoped>
/* Spotlight layer */
.spotlight-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;

  /* Motion + responsiveness */
  transition: background 0.15s ease;

  /* Defaults */
  --spot-x: 50%;
  --spot-y: 50%;
  --spot-radius: 45%;
  --spot-strength: 35%;
  /* --spot-color is injected from JS reading computed bg color */

  background: radial-gradient(
    circle at var(--spot-x) var(--spot-y),
    color-mix(in oklab, var(--spot-color, rgba(255,255,255,0.35)) var(--spot-strength), transparent),
    transparent var(--spot-radius)
  );
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .spotlight-card { transition: none; }
  .spotlight-card::before { transition: none; }
}
</style>

