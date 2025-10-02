<!-- layouts/default.vue (or your docs layout) -->
<template>
  <ContentDoc v-slot="{ doc }">
    <!-- Render the hero block (from ::hero … ::) if present -->
    <template v-if="doc?.hero">
      <HeroFrame outerClass="h-[62vh] md:h-[72vh]">
        <!-- Grab props like announcement/actions and the named text blocks -->
        <ContentSlot :use="doc.hero" v-slot="slot">
          <!-- Announcement badge -->
          <div v-if="slot.announcement" class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-wide text-white/80 ring-1 ring-white/10 backdrop-blur">
            <span class="h-2 w-2 rounded-full bg-emerald-400/80" />
            <NuxtLink :to="slot.announcement.to">{{ slot.announcement.title }}</NuxtLink>
          </div>

          <!-- Title and description come from the named child blocks -->
          <h1 class="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            <ContentSlot :use="doc.hero" name="title" unwrap="p" />
          </h1>
          <p class="mt-5 text-base leading-7 text-white/70 sm:text-lg">
            <ContentSlot :use="doc.hero" name="description" unwrap="p" />
          </p>

          <!-- Actions -->
          <div v-if="Array.isArray(slot.actions) && slot.actions.length" class="mt-8 flex flex-wrap items-center gap-3">
            <NuxtLink
              v-for="(a, i) in slot.actions"
              :key="i"
              :to="a.to"
              class="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2"
              :class="a.variant === 'ghost'
                ? 'text-white/90 bg-white/10 hover:bg-white/15 ring-1 ring-white/15 focus-visible:ring-white/30'
                : 'text-white bg-cyan-500/90 hover:bg-cyan-400 focus-visible:ring-cyan-300'"
            >
              <Icon v-if="a.leftIcon" :name="a.leftIcon" class="mr-2 h-4 w-4" />
              {{ a.name }}
            </NuxtLink>
          </div>

          <!-- Optional small footnote -->
          <div class="mt-6 text-xs text-white/50">
            v4 SDKs • Nuxt + Tailwind • AI-assisted docs
          </div>
        </ContentSlot>
      </HeroFrame>
    </template>

    <!-- Main article content -->
    <ContentRenderer :value="doc" />
  </ContentDoc>
</template>

<script setup lang="ts">
/* Ensure these are auto-registered (components/), or import explicitly */
</script>
