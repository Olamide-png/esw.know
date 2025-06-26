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


<section class="py-10 bg-gray-50 sm:py-16 lg:py-24">
  <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="text-3xl font-bold leading-tight text-black sm:text-4xl lg:text-5xl">Supported Versions</h2>
      <p class="max-w-md mx-auto mt-4 text-base leading-relaxed text-gray-600">ESW SFCC plugin compatibility with SiteGenesis and SFRA environments.</p>
    </div>

  <div class="mt-10 max-w-3xl mx-auto">
      <ul class="space-y-4 text-base text-gray-700">
        <li>
          <strong>SiteGenesis / Controllers:</strong> Supports the latest standard version.
        </li>
        <li>
          <strong>SiteGenesis / Pipelines:</strong> Core ESW controllers can be used for ESW backend functionality such as preOrder request, order confirmation, order cancellation, and inventory validation. The ESW SFCC plugin does not support the SiteGenesis pipeline version directly, but retailers can align custom pipelines with the provided controller patterns.
        </li>
        <li>
          <strong>SFRA Supported Versions:</strong> Fully compatible with SFRA v6.2 and backwards compatibility supported through version 4.4.0, including compatibility mode 22.7 and under.
        </li>
      </ul>
    </div>
  </div>
</section>

