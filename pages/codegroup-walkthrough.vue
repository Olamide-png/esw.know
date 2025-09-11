<script setup lang="ts">
import StepCodeWalkthrough from '~/components/StepCodeWalkthrough.vue'
import WorkbenchDrawer from '~/components/WorkbenchDrawer.vue'

const wbOpen = ref(false)

// Walkthrough steps
const steps = [
  { id: 1, title: 'Install Stripe SDK', body: 'Add Stripe server + client SDK.' },
  { id: 2, title: 'Create Checkout Session (server)', body: 'Return the session ID.' },
  { id: 3, title: 'Redirect to Checkout (client)', body: 'Use redirectToCheckout.' },
  { id: 4, title: 'Handle Webhook', body: 'Verify signature and fulfill.' }
]

// Single code sample with inline markers. (Markers are stripped from display)
const sampleCode = `// Install packages [1]
//   npm i stripe [1]
//   npm i @stripe/stripe-js [1]

import Stripe from 'stripe' // [2:start]
const stripe = new Stripe(process.env.STRIPE_SECRET!, { apiVersion: '2024-06-20' }) // [2]
export async function createCheckoutSession(req, res) { // [2]
  const session = await stripe.checkout.sessions.create({ // [2]
    mode: 'payment', // [2]
    success_url: 'https://example.com/success', // [2]
    cancel_url: 'https://example.com/cancel', // [2]
    line_items: [ // [2]
      { price: 'price_123', quantity: 1 }, // [2]
    ], // [2]
  }) // [2]
  res.json({ id: session.id }) // [2]
} // [2:end]

import { loadStripe } from '@stripe/stripe-js' // [3:start]
export async function goToCheckout() { // [3]
  const stripe = await loadStripe(import.meta.env.PUBLIC_STRIPE_PK) // [3]
  const { id } = await fetch('/api/checkout/create').then(r => r.json()) // [3]
  await stripe?.redirectToCheckout({ sessionId: id }) // [3]
} // [3:end]

// Server webhook handler [4:start]
export async function webhookHandler(req, res) { // [4]
  const sig = req.headers['stripe-signature'] // [4]
  let event // [4]
  try { // [4]
    event = stripe.webhooks.constructEvent(req.rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!) // [4]
  } catch (err) { // [4]
    return res.status(400).send(\`Webhook Error: \${err.message}\`) // [4]
  } // [4]
  if (event.type === 'checkout.session.completed') { // [4]
    const session = event.data.object // [4]
    // TODO: fulfill order // [4]
  } // [4]
  res.json({ received: true }) // [4]
} // [4:end]
`

// Workbench demo spec (unchanged)
const customsSpec = {
  baseUrl: 'https://httpbin.org',
  paths: {
    '/customs/items': {
      GET: {
        summary: 'List customs items',
        description: 'Returns a list with basic filters.',
        params: { query: { limit: 'number', offset: 'number', hsCode: 'string' } },
        headers: { 'X-Env': 'dev' }
      },
      POST: {
        summary: 'Create customs item',
        headers: { 'X-Env': 'dev' },
        body: { sku: 'SKU-123', hsCode: '9999.99.99', countryOfOrigin: 'IE', description: 'Wool scarf' }
      }
    },
    '/customs/items/{id}': {
      GET:  { summary: 'Get customs item by ID', params: { path: { id: 'string' } } },
      PUT:  { summary: 'Update customs item', params: { path: { id: 'string' } }, headers: { 'X-Env': 'dev' }, body: { description: 'Updated description' } },
      DELETE: { summary: 'Delete customs item', params: { path: { id: 'string' } } }
    }
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl p-6 space-y-4">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">Step ⇄ Code Walkthrough</h1>
        <p class="text-neutral-600 dark:text-neutral-400">
          Click a step to highlight the matching lines.
        </p>
      </div>

      <!-- Open Workbench -->
      <button
        class="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900
               border-neutral-200 dark:border-neutral-800"
        title="Open Workbench (Ctrl+`)"
        @click="wbOpen = true"
      >
        Open Workbench
      </button>
    </div>

    <!-- Single-code walkthrough -->
    <StepCodeWalkthrough
      :steps="steps"
      :code="sampleCode"
      language="js"
      :parse-markers="true"
      :initial-step="0"
    />

    <!-- floating fab (optional) -->
    <button
      class="fixed bottom-4 right-4 z-[62] rounded-full px-4 py-3 text-sm shadow-lg
             border border-neutral-200 dark:border-neutral-800
             bg-white/90 dark:bg-neutral-950/90 backdrop-blur hover:bg-white dark:hover:bg-neutral-900"
      title="Open Workbench (Ctrl+`)"
      @click="wbOpen = true"
    >
      Workbench
    </button>

    <!-- Drawer (left exactly as you had it) -->
    <WorkbenchDrawer v-model:open="wbOpen" :spec="customsSpec" />
  </div>
</template>

