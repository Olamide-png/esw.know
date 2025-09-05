export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component(
    'GlossaryInlineShadcn',
    defineAsyncComponent(() => import('~/components/GlossaryInlineShadcn.client.vue'))
  )
})

