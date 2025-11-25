// plugins/preline.client.ts
import { useRouter } from "vue-router";
import("preline/dist");  // Import Preline JS

export default defineNuxtPlugin(() => {
  const router = useRouter();
  router.afterEach(() => {
    // allow the DOM to update first
    setTimeout(() => window.HSStaticMethods.autoInit());
  });
});
