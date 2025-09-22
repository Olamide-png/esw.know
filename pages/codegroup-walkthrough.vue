<script setup lang="ts">
import StepCodeGroupWalkthrough from '~/components/StepCodeGroupWalkthrough.vue'
import WorkbenchDrawer from '~/components/WorkbenchDrawer.vue'
import ApiEndpointTryIt from '~/components/ApiEndpointTryIt.vue'

const wbOpen = ref(false)

// Steps (driven by inline markers in each code block)
const steps = [
  { id: 1, title: 'Install SDKs', body: 'Install server + client SDK.' },
  { id: 2, title: 'Create Checkout Session (server)', body: 'Return the session ID.' },
  { id: 3, title: 'Redirect to Checkout (client)', body: 'Use redirectToCheckout.' },
  { id: 4, title: 'Handle Webhook', body: 'Verify signature and fulfill.' }
]

// ——— JavaScript (with markers) ———
const codeJS = `// Install packages [1]
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

// Webhook [4:start]
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

// ——— TypeScript (reusing JS sample for demo) ———
const codeTS = codeJS

// ——— Python ———
const codePY = `# Install [1]
#   pip install stripe [1]

import os  # [2:start]
import stripe  # [2]
stripe.api_key = os.getenv("STRIPE_SECRET")  # [2]
from flask import Flask, request, jsonify  # [2]
app = Flask(__name__)  # [2]

@app.post("/create-checkout-session")  # [2]
def create_checkout_session():  # [2]
    session = stripe.checkout.Session.create(  # [2]
        mode="payment",  # [2]
        success_url="https://example.com/success",  # [2]
        cancel_url="https://example.com/cancel",  # [2]
        line_items=[{"price": "price_123", "quantity": 1}],  # [2]
    )  # [2]
    return jsonify(id=session.id)  # [2]  # [2:end]

# Client redirect [3:start]
# Use fetch('/create-checkout-session') to get session.id and redirect via client SDK.  # [3:end]

# Webhook [4:start]
from flask import Response  # [4]
@app.post("/webhook")  # [4]
def webhook():  # [4]
    sig = request.headers.get("stripe-signature")  # [4]
    try:  # [4]
        event = stripe.Webhook.construct_event(request.data, sig, os.getenv("STRIPE_WEBHOOK_SECRET"))  # [4]
    except Exception as e:  # [4]
        return Response(f"Webhook Error: {str(e)}", status=400)  # [4]
    if event["type"] == "checkout.session.completed":  # [4]
        session = event["data"]["object"]  # [4]
        # TODO: fulfill order  # [4]
    return jsonify(received=True)  # [4]  # [4:end]
`

const blocks = [
  { key: 'js', label: 'JavaScript', language: 'js', code: codeJS },
  { key: 'ts', label: 'TypeScript', language: 'ts', code: codeTS },
  { key: 'py', label: 'Python', language: 'py', code: codePY },
]

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

// Demo endpoints for the new Try-It component
const demoBase = 'https://httpbin.org'         // echoes any request       
const pathList = '/anything/customs/items'       // use /anything to avoid 404s
const pathById = '/anything/customs/items/{id}'
</script>

<template>
  <div class="mx-auto max-w-6xl p-6 space-y-6">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">Tabbed Step ⇄ Code Walkthrough</h1>
        <p class="text-neutral-600 dark:text-neutral-400">
          Click a step to highlight the matching lines. Switch tabs to see the same steps in different languages.
        </p>
      </div>

      <!-- Open Workbench -->
      <button
        class="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900
               border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
        title="Open Workbench (Ctrl+`)"
        @click="wbOpen = true"
      >
        <Icon name="lucide:code-xml" class="h-10 w-10" />
        Open Workbench
      </button>
    </div>

    <!-- F1 2021 Drivers' Championship -->
    <div class="space-y-3">
      <ApiEndpointTryIt
        method="GET"
        :base-url="'https://f1api.dev'"
        :allow-method-switch="false"
        :defaults="{ path: { year: '2021' }, query: { limit: 30, offset: 0 } }"
        path="/api/{year}/drivers-championship"
      />

      <ApiEndpointTryIt
        method="GET"
        :base-url="'https://api.nasa.gov'"
        :allow-method-switch="false"
        :defaults="{ query: { api_key: 'DEMO_KEY' } }"
        path="/planetary/apod"
      />

      <ApiEndpointTryIt
        method="GET"
        :base-url="demoBase"
        :allow-method-switch="false"
        :defaults="{ query: { limit: 10, offset: 0, hsCode: '6104.62' }, headers: { 'X-Env': 'dev' } }"
        :path="pathList"
      />

      <ApiEndpointTryIt
        method="POST"
        :base-url="demoBase"
        :allow-method-switch="false"
        :defaults="{ headers: { 'X-Env': 'dev', 'Content-Type': 'application/json' }, body: { sku: 'SKU-123', hsCode: '9999.99.99', countryOfOrigin: 'IE', description: 'Wool scarf' } }"
        :path="pathList"
      />

      <div class="grid gap-3 sm:grid-cols-2">
        <ApiEndpointTryIt
          method="GET"
          :base-url="demoBase"
          :path="pathById"
          :defaults="{ path: { id: 'abc-123' } }"
        />
        <ApiEndpointTryIt
          method="PUT"
          :base-url="demoBase"
          :path="pathById"
          :defaults="{ path: { id: 'abc-123' }, headers: { 'Content-Type': 'application/json' }, body: { description: 'Updated description' } }"
        />
      </div>
    </div>

    <!-- Tabbed walkthrough -->
    <StepCodeGroupWalkthrough
      :steps="steps"
      :blocks="blocks"
      :parse-markers="true"
      :initial-step="0"
      :initial-block="0"
    />

    <!-- floating fab -->
    <button
      class="fixed bottom-4 right-4 z-[62] rounded-full px-4 py-3 text-sm shadow-lg
             border border-neutral-200 dark:border-neutral-800
             bg-white/90 dark:bg-neutral-950/90 backdrop-blur hover:bg-white dark:hover:bg-neutral-900
             flex items-center gap-2"
      title="Open Workbench (Ctrl+`)"
      @click="wbOpen = true"
      aria-label="Open Workbench"
    >
      <Icon name="lucide:code-xml" class="h-10 w-10" />
      <span class="hidden sm:inline">Workbench</span>
    </button>

    <!-- Drawer (unchanged) -->
    <WorkbenchDrawer v-model:open="wbOpen" :spec="customsSpec" />
  </div>
</template>



