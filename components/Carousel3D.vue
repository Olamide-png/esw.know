<!-- components/Carousel3D.vue -->
<template>
  <div class="w-full max-w-6xl mx-auto">
    <div ref="container" class="carousel-container relative">
      <!-- Progress bar -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden z-20">
        <div ref="progressBar" class="progress-bar absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
      </div>

      <!-- Nav buttons -->
      <button
        class="nav-button absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center z-20 text-white touch-manipulation"
        @click="prevSlide"
        title="Previous slide"
        aria-label="Previous slide"
      >
        <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <button
        class="nav-button absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center z-20 text-white touch-manipulation"
        @click="nextSlide"
        title="Next slide"
        aria-label="Next slide"
      >
        <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      <!-- Track -->
      <div ref="track" class="carousel-track relative h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden">
        <!-- Slides -->
        <div class="carousel-item active absolute top-0 left-0 w-full h-full">
          <div class="w-full h-full p-4 sm:p-8">
            <div class="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden relative group">
              <img src="https://images.unsplash.com/photo-1515462277126-2dd0c162007a?auto=format&fit=crop&q=80"
                   alt="Geometric art installation"
                   class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-br from-violet-500/40 to-purple-500/40 mix-blend-overlay"></div>
              <div class="absolute inset-x-0 bottom-0 p-4 sm:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <h3 class="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Digital Prism</h3>
                <p class="text-gray-200 text-sm sm:text-base md:text-lg max-w-2xl">
                  Where geometry meets art in a stunning display of light and form.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="carousel-item next absolute top-0 left-0 w-full h-full">
          <div class="w-full h-full p-4 sm:p-8">
            <div class="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden relative group">
              <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80"
                   alt="Futuristic tech setup"
                   class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-br from-fuchsia-500/40 to-pink-500/40 mix-blend-overlay"></div>
              <div class="absolute inset-x-0 bottom-0 p-4 sm:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <h3 class="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Tech Haven</h3>
                <p class="text-gray-200 text-sm sm:text-base md:text-lg max-w-2xl">
                  Immerse yourself in the cutting edge of technology and innovation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="carousel-item is-hidden absolute top-0 left-0 w-full h-full">
          <div class="w-full h-full p-4 sm:p-8">
            <div class="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden relative group">
              <img src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80"
                   alt="Abstract digital art"
                   class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-br from-pink-500/40 to-rose-500/40 mix-blend-overlay"></div>
              <div class="absolute inset-x-0 bottom-0 p-4 sm:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <h3 class="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Neural Dreams</h3>
                <p class="text-gray-200 text-sm sm:text-base md:text-lg max-w-2xl">
                  AI-generated masterpieces that blur the line between human and machine creativity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Indicators -->
      <div class="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2 z-20">
        <button v-for="(n, i) in slideCount" :key="i"
                :title="`Go to slide ${i+1}`"
                @click="goTo(i)"
                :class="indicatorClass(i)"
                :aria-selected="i === currentSlide"
                class="transition-colors rounded-full"
                aria-label="Go to slide" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const container = ref(null)
const track = ref(null)
const progressBar = ref(null)

let autoAdvanceTimer = null
let touchStartX = 0

const currentSlide = ref(0)
const slides = ref([])

const slideCount = computed(() => slides.value.length)

function applyState () {
  slides.value.forEach((el, i) => {
    el.className = 'carousel-item absolute top-0 left-0 w-full h-full'
    if (i === currentSlide.value) {
      el.classList.add('active')
    } else if (i === (currentSlide.value + 1) % slideCount.value) {
      el.classList.add('next')
    } else if (i === (currentSlide.value - 1 + slideCount.value) % slideCount.value) {
      el.classList.add('prev')
    } else {
      el.classList.add('is-hidden') // avoid Tailwind's .hidden (display:none)
    }
  })
  if (progressBar.value) {
    progressBar.value.style.width = `${((currentSlide.value + 1) / slideCount.value) * 100}%`
  }
}

function nextSlide () {
  currentSlide.value = (currentSlide.value + 1) % slideCount.value
  applyState()
  restartAuto()
}
function prevSlide () {
  currentSlide.value = (currentSlide.value - 1 + slideCount.value) % slideCount.value
  applyState()
  restartAuto()
}
function goTo (i) {
  currentSlide.value = i
  applyState()
  restartAuto()
}
function stopAuto () {
  if (autoAdvanceTimer) clearInterval(autoAdvanceTimer)
  autoAdvanceTimer = null
}
function restartAuto () {
  stopAuto()
  autoAdvanceTimer = setInterval(nextSlide, 5000)
}

// for class binding on indicators
function indicatorClass (i) {
  const base = 'w-8 sm:w-12 h-1 sm:h-1.5'
  const active = i === currentSlide.value
  return `${base} ${active ? 'bg-white/60' : 'bg-white/20'} hover:bg-white/60`
}

onMounted(() => {
  // SSR-safe: only query in browser
  slides.value = Array.from(track.value?.querySelectorAll('.carousel-item') || [])

  if (!slides.value.length) return

  // Touch swipe
  track.value.addEventListener('touchstart', (e) => {
    if (e.changedTouches?.[0]) touchStartX = e.changedTouches[0].screenX
  }, { passive: true })

  track.value.addEventListener('touchend', (e) => {
    const endX = e.changedTouches?.[0]?.screenX ?? touchStartX
    const dx = touchStartX - endX
    if (Math.abs(dx) > 50) (dx > 0 ? nextSlide : prevSlide)()
  }, { passive: true })

  // Pause on hover (desktop)
  container.value.addEventListener('mouseenter', stopAuto)
  container.value.addEventListener('mouseleave', restartAuto)

  // Keyboard
  container.value.tabIndex = 0
  container.value.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { nextSlide(); e.preventDefault() }
    if (e.key === 'ArrowLeft')  { prevSlide(); e.preventDefault() }
  })

  applyState()
  restartAuto()
})

onBeforeUnmount(() => {
  stopAuto()
})
</script>

<style scoped>
.carousel-container {
  perspective: 1000px;
  touch-action: pan-y pinch-zoom;
}
.carousel-track {
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.carousel-item {
  backface-visibility: hidden;
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.carousel-item.active {
  opacity: 1;
  transform: scale(1) translateZ(0);
}
@media (max-width: 640px) {
  .carousel-item.prev {
    opacity: 0;
    transform: scale(0.8) translateX(-50%) translateZ(-100px);
  }
  .carousel-item.next {
    opacity: 0;
    transform: scale(0.8) translateX(50%) translateZ(-100px);
  }
}
@media (min-width: 641px) {
  .carousel-item.prev {
    opacity: 0.7;
    transform: scale(0.9) translateX(-100%) translateZ(-100px);
  }
  .carousel-item.next {
    opacity: 0.7;
    transform: scale(0.9) translateX(100%) translateZ(-100px);
  }
}
.carousel-item.is-hidden {
  opacity: 0;
  transform: scale(0.8) translateZ(-200px);
}
.nav-button {
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
@media (hover: hover) {
  .nav-button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
}
.nav-button:active {
  transform: scale(0.95);
}
.progress-bar {
  transition: width 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

/* Background effects from your snippet (optional, move to page if preferred) */
:global(body) {
  background-color: #000;
}
</style>
