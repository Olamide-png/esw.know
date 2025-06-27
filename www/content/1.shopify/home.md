---
title: Shopify
fullpage: true
navigation: false
---

:ellipsis{right=0px width=75% blur=150px}

::hero
---
announcement:
  title: 'Shopify'
actions:
  - name: Get Started
    to: /shopify/installation
    leftIcon: 'lucide:cable'
  - name: Integration
    variant: ghost
    to: /shopify/integration/overview
    leftIcon: 'lucide:plug'
  - name: Shopify Configuration
    variant: ghost
    to: /shopify/configuration/shopify-setup
    leftIcon: 'lucide:wrench'
---

#title
Shopify Native.

#description
The ESW integration with Shopify enables merchants to expand globally, process payments in multiple currencies, accurately calculate duties and taxes, streamline shipping, comply with regulations, and make data-driven optimizations.
::

::card
---
img: /Untitled design (1).png
---
#title
ESW Shopify integration

#content
ESW Shopify integration levarages Shopify's native checkout to handle shopper's purchase flow.
::
---

::card
---
icon: 'lucide:fold-horizontal'
icon-size: 26
horizontal: true
---

#title
Integration Features Matrix

#description
Shopify’s *look and feel* with ESW’s international DTC capabilities.
::

<div class="overflow-x-auto rounded-md border shadow-sm border-border my-8 bg-background">
  <table class="min-w-full border-collapse">
    <thead>
      <tr>
        <th class="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">Feature</th>
        <th class="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">Provider</th>
      </tr>
    </thead>
    <tbody class="[&>tr:nth-child(even)]:bg-transparent">
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Browsing</td>
        <td class="border-b border-border px-4 py-3 text-foreground">Shopify</td>
      </tr>
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Price calculation</td>
        <td class="border-b border-border px-4 py-3 text-foreground">ESW (embedded as pricing advisor service in Shopify)</td>
      </tr>
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Checkout flow</td>
        <td class="border-b border-border px-4 py-3 text-foreground">Shopify</td>
      </tr>
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Shipping methods and pricing</td>
        <td class="border-b border-border px-4 py-3 text-foreground">ESW (embedded as routing service in Shopify checkout)</td>
      </tr>
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Duties &amp; Taxes calculation</td>
        <td class="border-b border-border px-4 py-3 text-foreground">ESW</td>
      </tr>
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Payment methods</td>
        <td class="border-b border-border px-4 py-3 text-foreground">ESW (embedded as payment app in Shopify checkout)</td>
      </tr>
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Merchant Of Record</td>
        <td class="border-b border-border px-4 py-3 text-foreground">ESW (embedded as payment app in Shopify checkout)</td>
      </tr>
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Customer communications</td>
        <td class="border-b border-border px-4 py-3 text-foreground">Shopify</td>
      </tr>
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Gift cards, coupons, etc.</td>
        <td class="border-b border-border px-4 py-3 text-foreground">Shopify</td>
      </tr>
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Product restrictions</td>
        <td class="border-b border-border px-4 py-3 text-foreground">ESW (embedded in Shopify browsing)</td>
      </tr>
      <tr>
        <td class="border-b border-border px-4 py-3 text-foreground">Checkout Languages &amp; translations</td>
        <td class="border-b border-border px-4 py-3 text-foreground">Shopify</td>
      </tr>
      <tr>
        <td class="px-4 py-3 text-foreground">Returns &amp; tracking languages &amp; translations</td>
        <td class="px-4 py-3 text-foreground">ESW</td>
      </tr>
    </tbody>
  </table>
</div>




<section class="py-10 bg-white dark:bg-background sm:py-16 lg:py-24">
  <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
    <div class="max-w-xl mx-auto text-center">
      <h2 class="text-4xl font-bold text-black dark:text-white lg:text-5xl sm:text-5xl">Shopify vs ESW Responsibilities</h2>
      <p class="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
        Comparison of key features managed by Shopify vs ESW within the embedded experience.
      </p>
    </div>

  <!-- lg+ table layout -->
  <div class="hidden mt-16 lg:block shadow-lg rounded-xl border border-border overflow-hidden">
      <table class="w-full">
        <thead>
          <tr>
            <th class="py-8 pr-4 text-left text-sm font-semibold text-gray-800 dark:text-white bg-inherit">Feature</th>
            <th class="px-4 py-8 text-center bg-inherit">
              <span class="text-base font-medium text-blue-600">Shopify</span>
            </th>
            <th class="px-4 py-8 text-center bg-gray-900 rounded-t-xl">
              <span class="px-4 py-2 text-base font-medium text-white bg-blue-600 rounded-full">ESW</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="py-4 pr-4 font-medium border-b border-border text-gray-800 dark:text-white">Browsing</td>
            <td class="px-4 py-4 text-center border-b border-border text-foreground">✓</td>
            <td class="px-4 py-4 text-center text-white bg-gray-900 border-b border-white/20">Product Restrictions</td>
          </tr>
          <tr>
            <td class="py-4 pr-4 font-medium border-b border-border text-gray-800 dark:text-white">Price Calculation</td>
            <td class="px-4 py-4 text-center border-b border-border text-foreground">–</td>
            <td class="px-4 py-4 text-center text-white bg-gray-900 border-b border-white/20">Pricing Advisor</td>
          </tr>
          <tr>
            <td class="py-4 pr-4 font-medium border-b border-border text-gray-800 dark:text-white">Checkout Flow</td>
            <td class="px-4 py-4 text-center border-b border-border text-foreground">✓</td>
            <td class="px-4 py-4 text-center text-white bg-gray-900 border-b border-white/20">Integrated</td>
          </tr>
          <tr>
            <td class="py-4 pr-4 font-medium border-b border-border text-gray-800 dark:text-white">Shipping Methods</td>
            <td class="px-4 py-4 text-center border-b border-border text-foreground">–</td>
            <td class="px-4 py-4 text-center text-white bg-gray-900 border-b border-white/20">Routing Service</td>
          </tr>
          <tr>
            <td class="py-4 pr-4 font-medium border-b border-border text-gray-800 dark:text-white">Duties & Taxes</td>
            <td class="px-4 py-4 text-center border-b border-border text-foreground">–</td>
            <td class="px-4 py-4 text-center text-white bg-gray-900 border-b border-white/20">✓</td>
          </tr>
          <tr>
            <td class="py-4 pr-4 font-medium border-b border-border text-gray-800 dark:text-white">Payment Methods</td>
            <td class="px-4 py-4 text-center border-b border-border text-foreground">–</td>
            <td class="px-4 py-4 text-center text-white bg-gray-900 border-b border-white/20">Payment App</td>
          </tr>
          <tr>
            <td class="py-4 pr-4 font-medium border-b border-border text-gray-800 dark:text-white">Merchant of Record</td>
            <td class="px-4 py-4 text-center border-b border-border text-foreground">–</td>
            <td class="px-4 py-4 text-center text-white bg-gray-900 border-b border-white/20">✓</td>
          </tr>
          <tr>
            <td class="py-4 pr-4 font-medium border-b border-border text-gray-800 dark:text-white">Customer Communication</td>
            <td class="px-4 py-4 text-center border-b border-border text-foreground">✓</td>
            <td class="px-4 py-4 text-center text-white bg-gray-900 border-b border-white/20">–</td>
          </tr>
          <tr>
            <td class="py-4 pr-4 font-medium border-b border-border text-gray-800 dark:text-white">Gift Cards / Coupons</td>
            <td class="px-4 py-4 text-center border-b border-border text-foreground">✓</td>
            <td class="px-4 py-4 text-center text-white bg-gray-900 border-b border-white/20">–</td>
          </tr>
          <tr>
            <td class="py-4 pr-4 font-medium border-b border-border text-gray-800 dark:text-white">Translations</td>
            <td class="px-4 py-4 text-center border-b border-border text-foreground">✓</td>
            <td class="px-4 py-4 text-center text-white bg-gray-900 border-b border-white/20">Returns & Tracking</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>




