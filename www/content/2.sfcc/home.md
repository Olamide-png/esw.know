---
title: Home
fullpage: true
navigation: false
---

:ellipsis{right=0px width=75% blur=150px}

::hero
---
announcement:
  title: 'SFCC'
actions:
  - name: Quick Start Guide
    to: /sfcc/getting-started.md
    leftIcon: 'lucide:footprints'
  - name: Documentation
    variant: ghost
    to: /shopify/integration/overview.md
    leftIcon: 'lucide:file-text'
---

#title
Salesforce Commerce Cloud.

#description
The ESW cartridge enables seamless integration with ESW services, including hosted checkout, local payment methods, and an international logistics network.
::

::card
---
img: /Salesforce.jpg
---
#title
SFCC

#content
Self-manage site configuration, including the welcome mat configuration, landing page, country & currency widgets, and product prices.
::

<br>

::card
---
icon: 'lucide:videotape'
icon-size: 30
horizontal: true
---

#title
SFCC ESW cartridge

#description
The cartridge enables you to configure shipping method pricing, override price books, enable or disable specific countries, languages, and currencies, and manage a range of global preferences.
::

<br>

<!-- Enhanced Accordion with dark mode + larger font -->
<section class="w-full bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700 rounded shadow-md shadow-neutral-200 dark:shadow-neutral-800">
  <details class="p-6 group" open>
    <summary class="[&::-webkit-details-marker]:hidden relative flex gap-4 pr-8 text-xl font-bold list-none cursor-pointer text-neutral-800 dark:text-neutral-100 transition-colors duration-300 group-hover:text-neutral-900 dark:group-hover:text-white">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 stroke-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
      Features
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute right-0 w-10 h-10 transition duration-300 top-1 stroke-neutral-700 dark:stroke-neutral-300 shrink-0 group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </summary>
    <div class="mt-4 space-y-4 text-base text-neutral-700 dark:text-neutral-300">
      <p><strong>Localized Experience:</strong> The cartridge supports features such as the welcome mat and header/footer widgets, powered by GEO IP detection to create a tailored experience for international shoppers. It also supports multiple currencies per country or locale.</p>
      <p><strong>IP Geolocation:</strong> Automatically determines the shopper's location. When enabled, the shopper’s country is preselected, and users can adjust the shipping country, language, and currency via the welcome mat.</p>
      <p><strong>Localized Prices:</strong> Integrated with ESW’s Pricing Advisor, allowing you to define product pricing across markets with FX rates, uplifts, duties, and taxes included.</p>
      <p><strong>Prices Display:</strong> Supports displaying prices inclusive or exclusive of duties and taxes to help improve conversion rates.</p>
      <p><strong>Duty and Taxes:</strong> All duties and taxes are calculated using ESW’s checkout calculators for accurate totals per order.</p>
      <p><strong>Price Books:</strong> Offers single-site support for managing multiple price books, simplifying international pricing. You can also use a master price book to generate localized pricing across markets.</p>
      <p><strong>Localized Price Books:</strong> Generate localized price books using ESW’s FX rates, uplifts, taxes, duties, and rounding rules. <a href="#" class="text-primary underline">Learn more</a>.</p>
      <p><strong>Multiple FX Rates:</strong> Configure multiple base and settlement currencies per tenant. <a href="#" class="text-primary underline">Learn more</a>.</p>
      <p><strong>Promotions:</strong> Supports promotions in shopper currencies, extending SFCC’s native promotion capabilities beyond the default currency.</p>
      <p><strong>Shipping Overrides & Promotions:</strong> Allows for customized shipping overrides and local-market-specific shipping promotions.</p>
      <p><strong>Auto Catalog Sync:</strong> Integrated with Catalog 2.0, enabling automatic product catalog uploads to ESW using the Catalog file transfer process. <a href="#" class="text-primary underline">Learn more</a>.</p>
      <p><strong>Auto Package ASN Sync:</strong> Integrated with ESW's Package API v4.0, allowing package data to be sent via SFCC job automation.</p>
      <p><strong>Product Restrictions:</strong> Enables product availability controls by restricting specific items from being sold in designated countries. <a href="#" class="text-primary underline">Learn more</a>.</p>
    </div>
  </details>
</section>

<section class="py-10 bg-white dark:bg-neutral-950 sm:py-16 lg:py-24">
  <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 gap-12 text-center sm:grid-cols-2 md:grid-cols-3 lg:gap-y-16">

  <div>
        <div class="relative flex items-center justify-center mx-auto">
  <svg class="lucide w-9 h-9 text-blue-600 dark:text-blue-400" data-lucide="globe"></svg>
</div>
        <h3 class="mt-8 text-lg font-semibold text-neutral-900 dark:text-white">Localized Experience</h3>
        <p class="mt-4 text-base text-neutral-600 dark:text-neutral-400">Supports welcome mat, header/footer widgets, and GEO IP detection for personalized international shopper experiences.</p>
      </div>

  <div>
        <div class="relative flex items-center justify-center mx-auto">
          <i class="lucide lucide-dollar-sign w-9 h-9 text-green-600 dark:text-green-400"></i>
        </div>
        <h3 class="mt-8 text-lg font-semibold text-neutral-900 dark:text-white">Localized Pricing</h3>
        <p class="mt-4 text-base text-neutral-600 dark:text-neutral-400">Integrated with ESW’s Pricing Advisor to generate accurate, localized prices including FX, duties, taxes, and uplifts.</p>
      </div>

  <div>
        <div class="relative flex items-center justify-center mx-auto">
          <i class="lucide lucide-book-open w-9 h-9 text-purple-600 dark:text-purple-400"></i>
        </div>
        <h3 class="mt-8 text-lg font-semibold text-neutral-900 dark:text-white">Price Book Management</h3>
        <p class="mt-4 text-base text-neutral-600 dark:text-neutral-400">Supports master price books and localized variations to streamline global pricing strategies.</p>
      </div>

  <div>
        <div class="relative flex items-center justify-center mx-auto">
          <i class="lucide lucide-percent w-9 h-9 text-yellow-500 dark:text-yellow-400"></i>
        </div>
        <h3 class="mt-8 text-lg font-semibold text-neutral-900 dark:text-white">Promotions in Local Currency</h3>
        <p class="mt-4 text-base text-neutral-600 dark:text-neutral-400">Enable country-specific promotions in shopper currency beyond SFCC’s default settings.</p>
      </div>

  <div>
        <div class="relative flex items-center justify-center mx-auto">
          <i class="lucide lucide-package w-9 h-9 text-rose-600 dark:text-rose-400"></i>
        </div>
        <h3 class="mt-8 text-lg font-semibold text-neutral-900 dark:text-white">Shipping & Sync</h3>
        <p class="mt-4 text-base text-neutral-600 dark:text-neutral-400">Configure shipping overrides, sync catalog and ASN data automatically using Catalog 2.0 and Package API.</p>
      </div>

  <div>
        <div class="relative flex items-center justify-center mx-auto">
          <i class="lucide lucide-shield-ban w-9 h-9 text-lime-600 dark:text-lime-400"></i>
        </div>
        <h3 class="mt-8 text-lg font-semibold text-neutral-900 dark:text-white">Product Controls</h3>
        <p class="mt-4 text-base text-neutral-600 dark:text-neutral-400">Restrict product visibility by country and control catalog exposure by region.</p>
      </div>
    </div>
  </div>
</section>

