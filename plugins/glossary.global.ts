export default defineNuxtPlugin((nuxtApp) => {
  // auto-register for MDC usage like ::GlossaryInline ... ::
  nuxtApp.vueApp.component('GlossaryInline', defineAsyncComponent(() => import('~/www/components/GlossaryInline.client.vue')))
})


