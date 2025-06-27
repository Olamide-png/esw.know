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
Salesforce Commerce Cloud (SFCC)

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
SFCC ESW Cartridge

#description
Enables you to configure shipping method pricing, override price books, enable or disable specific countries, languages, and currencies, and manage a range of global preferences.
::

::card-group{cols=3}
  ::card{variant="blue"}
  ---
  title: Localized Experience
  icon: lucide:globe
  ---
  Supports welcome mat, header/footer widgets, and GEO IP detection for personalized international shopper experiences.
  ::

  ::card{class="bg-green-50 dark:bg-green-950"}
  ---
  title: Localized Pricing
  icon: lucide:dollar-sign
  ---
  Integrated with ESW’s Pricing Advisor to generate accurate, localized prices including FX, duties, taxes, and uplifts.
  ::

  ::card{class="bg-purple-50 dark:bg-purple-950"}
  ---
  title: Price Book Management
  icon: lucide:book-open
  ---
  Supports master price books and localized variations to streamline global pricing strategies.
  ::

  ::card{class="bg-yellow-50 dark:bg-yellow-950"}
  ---
  title: Promotions in Local Currency
  icon: lucide:percent
  ---
  Enable country-specific promotions in shopper currency beyond SFCC’s default settings.
  ::

  ::card{class="bg-rose-50 dark:bg-rose-950"}
  ---
  title: Shipping & Sync
  icon: lucide:package
  ---
  Configure shipping overrides, sync catalog and ASN data automatically using Catalog 2.0 and Package API.
  ::

  ::card{class="bg-lime-50 dark:bg-lime-950"}
  ---
  title: Product Controls
  icon: lucide:shield-ban
  ---
  Restrict product visibility by country and control catalog exposure by region.
  ::
::

<br>

  <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="text-3xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
        Supported Versions
      </h2>
      <p class="max-w-md mx-auto mt-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
        ESW SFCC plugin compatibility with SiteGenesis and SFRA environments.
      </p>
    </div>
  </div>


<section class="py-10 sm:py-16 lg:py-24">
  <div class="max-w-5xl px-4 mx-auto sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:items-stretch md:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-10">
      
  <!-- Left Column: Details -->
  <div class="flex flex-col justify-between lg:py-5">
        <div class="mt-auto">
          <div class="flex items-center space-x-1">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">SFRA</span>
            <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded-md">v6.2</span>
            <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded-md">Compat ≤ 22.7</span>
          </div>
          <div class="mt-2 flex items-center space-x-1">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">SG</span>
            <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-yellow-500 rounded-md">Controllers</span>
            <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-gray-600 rounded-md">Pipelines†</span>
          </div>
          <p class="mt-6 text-base leading-relaxed text-gray-800 dark:text-gray-200">
            ESW supports SFRA up to version <code class="font-JetBrains Mono text-sm px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">6.2</code>
  and compatibility mode versions ≤ 
  <code class="font-mono text-sm px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">22.7</code>.
  Backwards compatibility is maintained to 
  <code class="font-mono text-sm px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">SFRA v4.4.0</code>.
          </p>
          <p class="mt-4 text-base text-gray-700 dark:text-gray-300">
            <strong>Site Genesis / Controllers:</strong> ESW supports the latest standard controller-based Site Genesis versions.
          </p>
          <p class="mt-2 text-base text-gray-700 dark:text-gray-300">
            <strong>Site Genesis / Pipelines:</strong> While native pipeline support is not included, retailers may customize and align pipelines using the provided ESW controller logic.
          </p>
        </div>
      </div>

  <!-- Right Column: Card -->
  <div>
        <div class="overflow-hidden bg-gray-50 dark:bg-neutral-800 rounded-md shadow-md">
          <div class="p-10">
            <h3 class="text-xs font-semibold tracking-widest text-purple-600 uppercase dark:text-purple-400">SFCC Compatibility</h3>
            <ul class="flex flex-col mt-6 space-y-4">
              <li class="inline-flex items-center space-x-2">
                <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0L2.98 10.414a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span class="text-base font-medium text-gray-900 dark:text-white">SFRA v6.2 Supported</span>
              </li>
              <li class="inline-flex items-center space-x-2">
                <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0L2.98 10.414a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span class="text-base font-medium text-gray-900 dark:text-white">Compatibility Mode ≤ 22.7</span>
              </li>
              <li class="inline-flex items-center space-x-2">
                <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0L2.98 10.414a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span class="text-base font-medium text-gray-900 dark:text-white">Backwards Compatible to SFRA 4.4.0</span>
              </li>
              <li class="inline-flex items-center space-x-2">
                <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm.707 11.293a1 1 0 01-1.414 0L6.343 10.343a1 1 0 011.414-1.414L10 10.586l3.243-3.243a1 1 0 111.414 1.414l-4.95 4.95z" clip-rule="evenodd"/>
                </svg>
                <span class="text-base font-medium text-gray-900 dark:text-white">SG Controllers Supported</span>
              </li>
              <li class="inline-flex items-center space-x-2">
                <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" clip-rule="evenodd"/>
                </svg>
                <span class="text-base font-medium text-gray-900 dark:text-white">SG Pipelines Not Supported</span>
              </li>
            </ul>
            <div class="mt-8 text-sm text-gray-500 dark:text-gray-400">
              † Retailers can adapt SG pipelines to controller equivalents using the ESW plugin as reference.
            </div>
          </div>
        </div>
      </div>    
    </div>
  </div>
</section>



