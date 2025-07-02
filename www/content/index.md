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


<!-- Features -->
<div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
  <!-- Tab Nav -->
  <nav class="max-w-6xl mx-auto flex flex-col sm:flex-row gap-y-px sm:gap-y-0 sm:gap-x-4" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
    <!-- Tab 1 -->
    <button type="button" class="hs-tab-active:bg-gray-100 hs-tab-active:hover:border-transparent w-full flex flex-col text-start hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 p-3 md:p-5 rounded-xl dark:hs-tab-active:bg-neutral-800 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 active" id="tabs-with-card-item-1" aria-selected="true" data-hs-tab="#tabs-with-card-1" aria-controls="tabs-with-card-1" role="tab">
      <svg class="shrink-0 hidden sm:block size-7 hs-tab-active:text-blue-600 text-gray-800 dark:hs-tab-active:text-blue-500 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/><path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/><path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/><path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/><path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/></svg>
      <span class="sm:mt-5">
        <span class="hs-tab-active:text-blue-600 block font-semibold text-gray-800 dark:hs-tab-active:text-blue-500 dark:text-neutral-200">All-in-one workspace</span>
        <span class="hidden lg:block mt-2 text-gray-800 dark:text-neutral-200">Create a business, whether you’ve got a fresh idea.</span>
      </span>
    </button>

  <!-- Tab 2 -->
  <button type="button" class="hs-tab-active:bg-gray-100 hs-tab-active:hover:border-transparent w-full flex flex-col text-start hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 p-3 md:p-5 rounded-xl dark:hs-tab-active:bg-neutral-800 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800" id="tabs-with-card-item-2" aria-selected="false" data-hs-tab="#tabs-with-card-2" aria-controls="tabs-with-card-2" role="tab">
      <svg class="shrink-0 hidden sm:block size-7 hs-tab-active:text-blue-600 text-gray-800 dark:hs-tab-active:text-blue-500 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
      <span class="sm:mt-5">
        <span class="hs-tab-active:text-blue-600 block font-semibold text-gray-800 dark:hs-tab-active:text-blue-500 dark:text-neutral-200">Automation on a whole new level</span>
        <span class="hidden lg:block mt-2 text-gray-800 dark:text-neutral-200">Use automation to scale campaigns profitably and save time doing it.</span>
      </span>
    </button>
  </nav>
  
  <!-- End Tab Nav -->

  <!-- Tab Content -->
  <div class="mt-12 md:mt-16">
    <!-- Tab 1 Content -->
    <div id="tabs-with-card-1" role="tabpanel" aria-labelledby="tabs-with-card-item-1">
      <!-- Devices layout for Tab 1 goes here -->
      <!-- (keep your original Tab 1 content unchanged) -->
    </div>

  <!-- Tab 2 Content -->
  <div id="tabs-with-card-2" class="hidden" role="tabpanel" aria-labelledby="tabs-with-card-item-2">
      <!-- Devices layout for Tab 2 goes here -->
      <!-- (keep your original Tab 2 content unchanged) -->
    </div>
  </div>
  <!-- End Tab Content -->
</div>
<!-- End Features -->


::tabs{variant="line"}

  ::div{label="Welcome Mat Alert for Returning Shoppers"}
  The welcome mat can be configured to display an alert for returning shoppers who are traveling or accessing the storefront from a different country. To enable this, set the `custom preference` value to `True`.

  When the preference is set to `True`, the welcome mat will display the following alert to returning shoppers:

  ::alert{type="secondary" icon="lucide:info"}
  We noticed that you are currently accessing our website from a different country than your last visit. To view all the latest products and prices available in your area, please confirm your delivery country. If no changes are required, you can ignore this warning.
  ::

  Shoppers can then use the links in the alert to update their shipping country, language, and currency.
  ::

  ::div{label="Configure Welcome Mat to Display an Alert"}

  <img src="/Welcome mat 2.png" alt="Welcome Mat Image" class="w-1/3 mx-auto rounded-md" />


  1. Go to the **Online Marketing > Content Slots** settings.  
  2. Perform the `eswGeoIpChangeWarning` content slot configuration. The steps can be found here.

  ::alert{type="note" icon="lucide:pencil"}
  The welcome mat alert will only be shown to returning shoppers who have previously set a shipping country, language, and currency in your store.
  ::
  ::

::






<div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
  <!-- Grid -->
  <div class="md:grid md:grid-cols-2 md:items-center md:gap-12 xl:gap-32">
    <div>
      <img class="rounded-xl" src="https://images.unsplash.com/photo-1648737963503-1a26da876aca?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=900&h=900&q=80" alt="Features Image">
    </div>
    <!-- End Col -->

    <div class="mt-5 sm:mt-10 lg:mt-0">
      <div class="space-y-6 sm:space-y-8">
        <!-- Title -->
        <div class="space-y-2 md:space-y-4">
          <h2 class="font-bold text-3xl lg:text-4xl text-gray-800 dark:text-neutral-200">
            We tackle the challenges start-ups face
          </h2>
          <p class="text-gray-500 dark:text-neutral-500">
            Besides working with start-up enterprises as a partner for digitalization, we have built enterprise products for common pain points that we have encountered in various products and projects.
          </p>
        </div>
        <!-- End Title -->

        <!-- List -->
        <ul class="space-y-2 sm:space-y-4">
          <li class="flex gap-x-3">
            <span class="mt-0.5 size-5 flex justify-center items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-800/30 dark:text-blue-500">
              <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <div class="grow">
              <span class="text-sm sm:text-base text-gray-500 dark:text-neutral-500">
                <span class="font-bold">Easy & fast</span> designing
              </span>
            </div>
          </li>

          <li class="flex gap-x-3">
            <span class="mt-0.5 size-5 flex justify-center items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-800/30 dark:text-blue-500">
              <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <div class="grow">
              <span class="text-sm sm:text-base text-gray-500 dark:text-neutral-500">
                Powerful <span class="font-bold">features</span>
              </span>
            </div>
          </li>

          <li class="flex gap-x-3">
            <span class="mt-0.5 size-5 flex justify-center items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-800/30 dark:text-blue-500">
              <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <div class="grow">
              <span class="text-sm sm:text-base text-gray-500 dark:text-neutral-500">
                User Experience Design
              </span>
            </div>
          </li>
        </ul>
        <!-- End List -->
      </div>
    </div>
    <!-- End Col -->
  </div>
  <!-- End Grid -->
</div>
<!-- End Features -->


<section>
 <div class="px-8 py-24 mx-auto md:px-12 lg:px-32 max-w-screen-xl flex flex-col lg:h-svh justify-center">
  <div class="flex flex-col ">
   <div class="prose text-gray-500 prose-sm prose-headings:font-normal prose-headings:text-xl">
    <div>
     <h2>ESW Retailer Display Configuration</h2>
     <p class="text-balance">
      Use custom preferences to manage ESW retailer display configurations.
     </p>
    </div>
   </div> <!-- Starts component -->
   <div class="mt-6 border-t pt-12">
    <div class="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-24 items-center ">
     <div> <span class="text-gray-600  uppercase text-xs font-medium "> This group enables or disables the functionality at the site level for the landing page, header, and footer. </span>
      <p class="text-4xl mt-8 tracking-tighter font-semibold text-gray-700 text-balance"> Site Preferences </p>
      <p class="text-sm  mt-4 text-gray-700 text-balance"> After adding or updating any value on the attributes, click Save to apply the changes. </p>
      <div class="mt-6 text-xs font-medium grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 text-gray-950">
       <div class="inline-flex items-center gap-2  text-xs text-gray-700"> <svg class="icon icon-tabler text-gray-700 size-4 icon-tabler-360" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
         <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
         <path d="M17 15.328c2.414 -.718 4 -1.94 4 -3.328c0 -2.21 -4.03 -4 -9 -4s-9 1.79 -9 4s4.03 4 9 4"></path>
         <path d="M9 13l3 3l-3 3"></path>
        </svg> <span class="text-gray-950 font-medium text-sm"> ESW Enable Landing Page: </span>  Select to show or hide the Welcome Landing Page at the storefront end. </div>
       <div class="inline-flex items-center gap-2  text-xs text-gray-700"> <svg class="icon icon-tabler text-gray-700 size-4 icon-tabler-antenna-bars-3" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
         <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
         <path d="M6 18l0 -3"></path>
         <path d="M10 18l0 -6"></path>
         <path d="M14 18l0 .01"></path>
         <path d="M18 18l0 .01"></path>
        </svg> <span class="text-gray-950 font-medium text-sm"> Reduced external factors </span> </div>
       <div class="inline-flex items-center gap-2  text-xs text-gray-700"> <svg class="icon icon-tabler text-gray-700 size-4 icon-tabler-load-balancer" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
         <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
         <path d="M12 13m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
         <path d="M12 20m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
         <path d="M12 16v3"></path>
         <path d="M12 10v-7"></path>
         <path d="M9 6l3 -3l3 3"></path>
         <path d="M12 10v-7"></path>
         <path d="M9 6l3 -3l3 3"></path>
         <path d="M14.894 12.227l6.11 -2.224"></path>
         <path d="M17.159 8.21l3.845 1.793l-1.793 3.845"></path>
         <path d="M9.101 12.214l-6.075 -2.211"></path>
         <path d="M6.871 8.21l-3.845 1.793l1.793 3.845"></path>
        </svg> <span class="text-gray-950 font-medium text-sm"> enhanced stabilty </span> </div>
       <div class="inline-flex items-center gap-2  text-xs text-gray-700"> <svg class="icon icon-tabler text-gray-700 size-4 icon-tabler-brand-speedtest" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
         <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
         <path d="M5.636 19.364a9 9 0 1 1 12.728 0"></path>
         <path d="M16 9l-4 4"></path>
        </svg> <span class="text-gray-950 font-medium text-sm"> accelerated times </span> </div>
      </div>
     </div>
     <div class="h-full md:order-first"> <img src="/1152442a16f59952c1b22fe62b88e225 (1).png" alt="#_" class=" bg-gray-200 shadow-box shadow-gray-500/30 overflow-hidden aspect-square  w-full h-full object-cover object-center"> </div>
    </div>
    <div class="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-24 items-center md:flex-row-reverse">
     <div> <span class="text-gray-600  uppercase text-xs font-medium "> Just because we can </span>
      <p class="text-4xl mt-8 tracking-tighter font-semibold text-gray-700 text-balance"> Tailored financial solutions for any scenario </p>
      <p class="text-sm  mt-4 text-gray-700 text-balance"> Discover a range of financial instruments and personalized advice designed to meet your unique requirements. </p>
      <div class="mt-6 text-xs font-medium grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 text-gray-950">
       <div class="inline-flex items-center gap-2  text-xs text-gray-700"> <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-database text-gray-700 size-4" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
         <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
         <path d="M12 6m-8 0a8 3 0 1 0 16 0a8 3 0 1 0 -16 0"></path>
         <path d="M4 6v6a8 3 0 0 0 16 0v-6"></path>
         <path d="M4 12v6a8 3 0 0 0 16 0v-6"></path>
        </svg> <span class="text-gray-950 font-medium text-sm"> Transparent Data Access </span> </div>
       <div class="inline-flex items-center gap-2  text-xs text-gray-700"> <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-building text-gray-700 size-4" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
         <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
         <path d="M3 21l18 0"></path>
         <path d="M9 8l1 0"></path>
         <path d="M9 12l1 0"></path>
         <path d="M9 16l1 0"></path>
         <path d="M14 8l1 0"></path>
         <path d="M14 12l1 0"></path>
         <path d="M14 16l1 0"></path>
         <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16"></path>
        </svg> <span class="text-gray-950 font-medium text-sm"> Lowered Interference </span> </div>
       <div class="inline-flex items-center gap-2  text-xs text-gray-700"> <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-augmented-reality-2 text-gray-700 size-4" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
         <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
         <path d="M10 21h-2a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v3.5"></path>
         <path d="M17 17l-4 -2.5l4 -2.5l4 2.5v4.5l-4 2.5z"></path>
         <path d="M13 14.5v4.5l4 2.5"></path>
         <path d="M17 17l4 -2.5"></path>
         <path d="M11 4h2"></path>
        </svg> <span class="text-gray-950 font-medium text-sm"> Improved Reliability </span> </div>
       <div class="inline-flex items-center gap-2  text-xs text-gray-700"> <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-time-duration-0 text-gray-700 size-4" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
         <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
         <path d="M3 12v.01"></path>
         <path d="M21 12v.01"></path>
         <path d="M12 21v.01"></path>
         <path d="M12 3v.01"></path>
         <path d="M7.5 4.2v.01"></path>
         <path d="M16.5 4.2v.01"></path>
         <path d="M16.5 19.8v.01"></path>
         <path d="M7.5 19.8v.01"></path>
         <path d="M4.2 16.5v.01"></path>
         <path d="M19.8 16.5v.01"></path>
         <path d="M19.8 7.5v.01"></path>
         <path d="M4.2 7.5v.01"></path>
         <path d="M10 11v2a2 2 0 1 0 4 0v-2a2 2 0 1 0 -4 0z"></path>
        </svg> <span class="text-gray-950 font-medium text-sm"> Faster Processing Times </span> </div>
      </div>
     </div>
     <div class="h-full "> <img src="/1152442a16f59952c1b22fe62b88e225 (1).png" alt="#_" class=" bg-gray-200 shadow-box shadow-gray-500/30 overflow-hidden aspect-square  w-full h-full object-cover object-center"> </div>
    </div>
   </div> <!-- Emds component -->
   <!-- Starts links to tutorial -->
   <div class="pointer-events-none fixed inset-x-0 bottom-0 sm:flex sm:justify-center p-2">
    <div class="pointer-events-auto flex w-full max-w-md divide-x divide-neutral-200 rounded-lg bg-white shadow-xl border">
     <div class="flex w-0 flex-1 items-center p-4">
      <div class="w-full">
       <p class="text-sm font-medium text-neutral-900">Tutorial</p>
       <p class="mt-1 text-sm text-neutral-500">
        How to simplify your code and avoid repeating your markup with
        Astrojs and Tailwind CSS
       </p>
       <p class="mt-2 text-xs text-orange-500 underline"> <a href="https://lexingtonthemes.com">
         by © Lexington Themes</a> </p>
      </div>
     </div>
     <div class="flex">
      <div class="flex flex-col divide-y divide-neutral-200">
       <div class="flex h-0 flex-1"> <a href="https://lexingtonthemes.com/tutorials/how-to-simplify-your-code-and-avoid-repeating-your-markup-with-astrojs-and-tailwind-css/" type="button" class="flex w-full items-center justify-center rounded-none rounded-tr-lg border border-transparent px-4 py-3 text-sm font-medium text-orange-600 hover:text-orange-500 focus:z-10 focus:outline-none focus:ring-2 focus:ring-orange-500">Tutorial</a> </div>
       <div class="flex h-0 flex-1"> <a href="https://github.com/Lexington-Themes/lexington-tutorials/blob/main/src/pages/simplified-markup/index.astro" class="flex w-full items-center justify-center rounded-none rounded-br-lg border border-transparent px-4 py-3 text-sm font-medium text-neutral-700 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500">Get the code</a> </div>
      </div>
     </div>
    </div>
   </div> <!-- Ends links to tutorial -->
  </div>
 </div>
</section>


<div class="bg-white py-24 sm:py-32">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        <div>
          <h2 class="text-lg font-semibold leading-8 tracking-tight text-indigo-600">Everything you need</h2>
          <p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">All-in-one platform</p>
          <p class="mt-6 text-base leading-7 text-gray-600">Lorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores impedit perferendis suscipit eaque, iste dolor cupiditate blanditiis ratione.</p>
        </div>
        <dl class="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:gap-y-16">
          
            <div class="relative pl-9">
              <dt class="font-semibold text-gray-900">
                <svg class="absolute top-1 left-0 h-5 w-5 text-indigo-500" x-description="Heroicon name: mini/check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"></path>
</svg>
                Invite team members
              </dt>
              <dd class="mt-2">Rerum repellat labore necessitatibus reprehenderit molestiae praesentium.</dd>
            </div>
          
            <div class="relative pl-9">
              <dt class="font-semibold text-gray-900">
                <svg class="absolute top-1 left-0 h-5 w-5 text-indigo-500" x-description="Heroicon name: mini/check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"></path>
</svg>
                List view
              </dt>
              <dd class="mt-2">Corporis asperiores ea nulla temporibus asperiores non tempore assumenda aut.</dd>
            </div>
          
            <div class="relative pl-9">
              <dt class="font-semibold text-gray-900">
                <svg class="absolute top-1 left-0 h-5 w-5 text-indigo-500" x-description="Heroicon name: mini/check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"></path>
</svg>
                Keyboard shortcuts
              </dt>
              <dd class="mt-2">In sit qui aliquid deleniti et. Ad nobis sunt omnis. Quo sapiente dicta laboriosam.</dd>
            </div>
          
            <div class="relative pl-9">
              <dt class="font-semibold text-gray-900">
                <svg class="absolute top-1 left-0 h-5 w-5 text-indigo-500" x-description="Heroicon name: mini/check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"></path>
</svg>
                Calendars
              </dt>
              <dd class="mt-2">Sed rerum sunt dignissimos ullam. Iusto iure occaecati voluptate eligendi fugiat sequi.</dd>
            </div>
          
            <div class="relative pl-9">
              <dt class="font-semibold text-gray-900">
                <svg class="absolute top-1 left-0 h-5 w-5 text-indigo-500" x-description="Heroicon name: mini/check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"></path>
</svg>
                Notifications
              </dt>
              <dd class="mt-2">Quos inventore harum enim nesciunt. Aut repellat rerum omnis adipisci.</dd>
            </div>
          
            <div class="relative pl-9">
              <dt class="font-semibold text-gray-900">
                <svg class="absolute top-1 left-0 h-5 w-5 text-indigo-500" x-description="Heroicon name: mini/check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"></path>
</svg>
                Boards
              </dt>
              <dd class="mt-2">Quae sit sunt excepturi fugit veniam voluptatem ipsum commodi.</dd>
            </div>
          
            <div class="relative pl-9">
              <dt class="font-semibold text-gray-900">
                <svg class="absolute top-1 left-0 h-5 w-5 text-indigo-500" x-description="Heroicon name: mini/check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"></path>
</svg>
                Reporting
              </dt>
              <dd class="mt-2">Eos laudantium repellat sed architecto earum unde incidunt. Illum sit dolores voluptatem.</dd>
            </div>
          
            <div class="relative pl-9">
              <dt class="font-semibold text-gray-900">
                <svg class="absolute top-1 left-0 h-5 w-5 text-indigo-500" x-description="Heroicon name: mini/check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"></path>
</svg>
                Mobile app
              </dt>
              <dd class="mt-2">Nulla est saepe accusamus nostrum est est. Fugit voluptatum omnis quidem voluptatem.</dd>
            </div>
          
        </dl>
      </div>
    </div>
  </div>