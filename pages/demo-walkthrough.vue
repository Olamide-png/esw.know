<template>
  <div class="mx-auto max-w-6xl p-6">
    <h1 class="text-2xl font-bold mb-2">Stripe-like Step ⇄ Code Walkthrough</h1>
    <p class="mb-6 text-neutral-600 dark:text-neutral-400">
      Click a step to highlight the corresponding lines. Markers like
      <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">[1]</code> or
      <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">[2:start]</code>…
      <code class="px-1 rounded bg-neutral-100 dark:bg-neutral-800">[2:end]</code>
      are stripped from the visible code but used for mapping.
    </p>

    <StepCodeWalkthrough
      :steps="steps"
      :code="sampleCode"
      language="js"
      :parse-markers="true"
      :initial-step="0"
    />
  </div>
</template>

<script setup lang="ts">
import StepCodeWalkthrough from '~/components/StepCodeWalkthrough.vue'

const steps = [
  {
    id: 1,
    title: 'Install Stripe SDK',
    body: 'Add Stripe server + client SDK to your project (server for sessions, client for redirect).'
  },
  {
    id: 2,
    title: 'Create a Checkout Session (server)',
    body: 'Create a session on your server and return the session ID to the client.'
  },
  {
    id: 3,
    title: 'Redirect to Checkout (client)',
    body: 'Call stripe.redirectToCheckout with the session ID from the server.'
  },
  {
    id: 4,
    title: 'Handle Webhook',
    body: 'Verify and handle checkout.session.completed to fulfill orders.'
  }
]

// NOTE: We include markers like [1], [2:start]...[2:end]. They won’t show in the UI.
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
    return res.status(400).send(`Webhook Error: ${err.message}`) // [4]
  } // [4]
  if (event.type === 'checkout.session.completed') { // [4]
    const session = event.data.object // [4]
    // TODO: fulfill order // [4]
  } // [4]
  res.json({ received: true }) // [4]
} // [4:end]
`
</script>