---
title: Home
navigation: false
---

:ellipsis{right=0px width=75% blur=150px}

::hero
---
announcement:
  title: '1.0.0 release'
  to: /blog/v1
actions:
  - name: Get Started
    to: /getting-started/installation
    leftIcon: 'lucide:cable'
  - name: Integration
    variant: ghost
    to: /integration/integration/overview
    leftIcon: 'lucide:plug'
  - name: Basics
    variant: ghost
    to: /getting-started/the-basics/supported-countries
    leftIcon: 'lucide:shapes'
---

#title
Shopify Native.

#description
The ESW integration with Shopify enables merchants to expand globally, process payments in multiple currencies, accurately calculate duties and taxes, streamline shipping, comply with regulations, and make data-driven optimizations.
::

<figure class="relative h-96 w-full">
    <img src="/Untitled design (1).png" class="h-full w-full rounded-xl object-cover object-center" />
    <figcaption class="absolute bottom-4 left-1/2 w-[calc(100%-2rem)] -translate-x-1/2 overflow-hidden rounded-lg border border-slate-200 bg-white bg-opacity-75 shadow-lg shadow-slate-950/5 saturate-200 backdrop-blur-md">
        <div class="flex h-max w-full justify-between rounded px-4 py-2">
            <div>
                <h6 class="font-sans text-base font-bold text-current antialiased md:text-lg lg:text-xl">ESW Shopify Integration</h6>
                <p class="mt-1 font-sans text-base text-slate-600 antialiased">ESW Shopify integration levarages Shopify's native checkout to handle shopper's purchase flow</p>
            </div>
            <p class="font-sans text-base font-bold text-current antialiased">ESW</p>
        </div>
    </figcaption>
</figure>


---

::card
---
icon: 'lucide:fold-horizontal'
icon-size: 26
horizontal: true
---

#title
Integration Features

#description
Shopify’s *look and feel* with ESW’s international DTC capabilities.
::

<div class="overflow-x-auto rounded-md border shadow-sm border-border my-8 bg-background">
  <table class="min-w-full border-collapse">
    <thead>
      <tr>
        <th class="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">Feature</th>
        <th class="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">By</th>
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




::tabs{variant="line"}
  ::div{label="Preview"}
  <div class="border flex min-h-[200px] w-full justify-center p-10 items-center rounded-lg shadow-xs">
    <span class="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900 dark:text-blue-100">
      Badge
    </span>
  </div>
  ::

  ::div{label="Code"}
  ```tsx
  import { Badge } from "@/components/ui/badge"

  export function BadgeDemo() {
    return <Badge>Badge</Badge>
  }
::


::tabs{variant="line"}
  ::div{label="Landing Page Settings"}
  <h2 class="text-3xl font-bold text-gray-500 mb-2 text-center">Configure Landing Page Settings</h2>

  <div class="mt-6 pt-12">
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 border">
      <div class="mx-auto grid grid-cols-1 gap-8 overflow-hidden lg:mx-0 lg:grid-cols-3">
        <div>
          <time datetime="August 2021" class="flex items-center text-sm font-semibold leading-6 text-orange-600 dark:text-orange-400">
            <svg viewBox="0 0 4 4" class="mr-4 h-1 w-1 flex-none" aria-hidden="true">
              <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
            </svg>
            Navigate
            <div class="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 dark:bg-gray-500"></div>
          </time>
          <p class="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900 dark:text-white">
            Custom Preferences Settings
          </p>
          <p class="mt-1 text-md leading-7 text-gray-500 dark:text-gray-300">
            Merchant Tools &gt; Site Preferences &gt; Custom Preferences settings
          </p>
        </div>

        <div>
          <time datetime="December 2021" class="flex items-center text-sm font-semibold leading-6 text-orange-600 dark:text-orange-400">
            <svg viewBox="0 0 4 4" class="mr-4 h-1 w-1 flex-none" aria-hidden="true">
              <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
            </svg>
            Click link
            <div class="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 dark:bg-gray-500"></div>
          </time>
          <p class="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900 dark:text-white">
            ESW Retailer Display Configuration
          </p>
          <p class="mt-1 text-md leading-7 text-gray-500 dark:text-gray-300">
            Click on the ESW Retailer Display Configuration link.
          </p>
        </div>

        <div>
          <time datetime="February 2022" class="flex items-center text-sm font-semibold leading-6 text-orange-600 dark:text-orange-400">
            <svg viewBox="0 0 4 4" class="mr-4 h-1 w-1 flex-none" aria-hidden="true">
              <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
            </svg>
            Configure
            <div class="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 dark:bg-gray-500"></div>
          </time>
          <p class="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900 dark:text-white">
            ESW Retailer Display Configuration
          </p>
          <p class="mt-1 text-md leading-7 text-gray-500 dark:text-gray-300">
            Configure the landing page-related custom preferences.
          </p>
        </div>
      </div>
    </div>
  </div>
  ::

  ::div{label="Welcome Mat Content"}
  <h2 class="text-3xl font-bold text-gray-500 mb-2 text-center">Configure Welcome Mat Landing Page Content</h2>

  <div class="mt-6 pt-12">
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 border">
      <div class="mx-auto grid grid-cols-1 gap-8 overflow-hidden lg:mx-0 lg:grid-cols-2">
        <div>
          <time datetime="August 2021" class="flex items-center text-sm font-semibold leading-6 text-orange-600 dark:text-orange-400">
            <svg viewBox="0 0 4 4" class="mr-4 h-1 w-1 flex-none" aria-hidden="true">
              <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
            </svg>
            Navigate
            <div class="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 dark:bg-gray-500"></div>
          </time>
          <p class="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900 dark:text-white">
            Content Slot Settings
          </p>
          <p class="mt-1 text-md leading-7 text-gray-500 dark:text-gray-300">
            Online Marketing &gt; Content Slots settings
          </p>
        </div>

        <div>
          <time datetime="December 2021" class="flex items-center text-sm font-semibold leading-6 text-orange-600 dark:text-orange-400">
            <svg viewBox="0 0 4 4" class="mr-4 h-1 w-1 flex-none" aria-hidden="true">
              <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
            </svg>
            Configure
            <div class="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 dark:bg-gray-500"></div>
          </time>
          <p class="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900 dark:text-white">
            Content Slot Configurations
          </p>
          <p class="mt-1 text-md leading-7 text-gray-500 dark:text-gray-300">
            Make the necessary <code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 text-xs font-mono">eswLandingContent</code> content slot configurations.
          </p>
        </div>
      </div>
    </div>
  </div>
  ::
::
