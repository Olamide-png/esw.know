<script setup lang="ts">
import {
  Rocket,
  Code2,
  HeartHandshake,
  Sparkles,
  Target,
  Zap
} from 'lucide-vue-next'

const reasons = [
  {
    title: 'Modern Technology',
    description:
      'Our components are built on Vue 3, Composition API, and TypeScript for maximum performance and developer-friendliness.',
    icon: Rocket,
  },
  {
    title: 'Clean Code',
    description:
      'Clean, maintainable code following the latest best practices. Each component is optimized and well-documented.',
    icon: Code2,
  },
  {
    title: 'Personal Support',
    description:
      'Our dedicated support team is here to help with any questions. Fast response times and competent assistance guaranteed.',
    icon: HeartHandshake,
  },
  {
    title: 'Innovation',
    description:
      'Regular updates with new features and components. We stay up-to-date and set new trends.',
    icon: Sparkles,
  },
  {
    title: 'Goal-Oriented',
    description:
      'Focus on your needs. Our components are field-tested and optimized for real-world applications.',
    icon: Target,
  },
  {
    title: 'Performance',
    description:
      'Optimized loading times and minimal resource consumption. Fast, responsive components for the best user experience.',
    icon: Zap,
  },
]
</script>

<template>
  <section class="relative w-full flex items-center bg-white py-8 md:py-16 lg:py-24">
    <div class="container mx-auto px-4 md:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <p class="text-sm font-medium text-primary mb-4">Why Choose Us</p>
        <h2 class="text-4xl font-bold tracking-tighter sm:text-5xl mb-6">
          Why <span class="text-primary">VueBlocks</span>?
        </h2>
        <p class="text-lg text-muted-foreground">
          Discover why developers trust our components for building modern web applications
        </p>
      </div>

      <!-- Reasons Grid -->
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="(reason, i) in reasons" :key="i"
          class="group relative bg-card hover:bg-accent/5 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg">
          <!-- Icon -->
          <div class="mb-6 inline-block">
            <div class="relative">
              <!-- Background Circle -->
              <div
                class="absolute inset-0 rounded-full bg-primary/10 transform scale-150 opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div
                class="relative flex size-16 items-center justify-center rounded-full bg-accent/10 group-hover:bg-primary transition-all duration-300">
                <component :is="reason.icon"
                  class="size-7 text-primary group-hover:text-white transition-colors duration-300" />
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="relative">
            <h3 class="text-xl font-semibold mb-3">{{ reason.title }}</h3>
            <p class="text-muted-foreground">{{ reason.description }}</p>
          </div>

          <!-- Border Gradient -->
          <div
            class="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-all duration-300" />
        </div>
      </div>
    </div>
  </section>
</template>
