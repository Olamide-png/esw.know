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




<div class="px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <div class="text-center">
      <h2 class="text-slate-900 text-4xl font-bold mb-4">Shopify vs ESW Responsibilities</h2>
      <p class="text-[15px] text-slate-600">A side-by-side comparison of the commerce functions handled by Shopify and ESW.</p>
    </div>

  <div class="grid md:grid-cols-2 items-center gap-y-6 mt-12 max-md:max-w-md max-md:mx-auto">
      <!-- Shopify Card -->
      <div class="bg-white border border-gray-300 shadow-sm md:rounded-tl-3xl md:rounded-bl-3xl max-md:rounded-3xl p-8 sm:p-10">
        <h3 class="text-slate-900 text-lg font-semibold mb-4">Handled by Shopify</h3>
        <ul class="space-y-5">
          <li class="flex items-center text-[15px] text-slate-600 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Browsing
          </li>
          <li class="flex items-center text-[15px] text-slate-600 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Checkout flow
          </li>
          <li class="flex items-center text-[15px] text-slate-600 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Customer communications
          </li>
          <li class="flex items-center text-[15px] text-slate-600 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Gift cards, coupons, etc.
          </li>
          <li class="flex items-center text-[15px] text-slate-600 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Checkout languages & translations
          </li>
        </ul>
      </div>

  <!-- ESW Card -->
  <div class="bg-slate-900 border border-gray-900 shadow-2xl rounded-3xl p-8 sm:p-10 relative md:right-1">
        <h3 class="text-white text-lg font-semibold mb-4">Handled by ESW</h3>
        <ul class="space-y-5">
          <li class="flex items-center text-[15px] text-slate-300 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Price calculation
          </li>
          <li class="flex items-center text-[15px] text-slate-300 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Shipping methods & pricing
          </li>
          <li class="flex items-center text-[15px] text-slate-300 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Duties & taxes calculation
          </li>
          <li class="flex items-center text-[15px] text-slate-300 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Payment methods
          </li>
          <li class="flex items-center text-[15px] text-slate-300 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Merchant of Record
          </li>
          <li class="flex items-center text-[15px] text-slate-300 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Product restrictions
          </li>
          <li class="flex items-center text-[15px] text-slate-300 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" class="mr-3 fill-green-500" viewBox="0 0 24 24">
              <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
            </svg>
            Returns & tracking translations
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>





