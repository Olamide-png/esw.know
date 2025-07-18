---
title: Release Notes
description: What's New
icon: 'lucide:notebook-pen'
---

## v4.7.1

<br>

:badge[2025-07-06]{variant="secondary"}

<!-- component -->
  <div class="max-w-xl mx-auto p-8">
    <div class="flow-root">
      <ul class="-mb-8">

<!-- Feature Entry 1 -->

<div class="relative pb-8">
            <span class="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
            <div class="relative flex items-start space-x-3">
              <div>
                <div class="relative px-1">
                  <div class="h-8 w-8 bg-blue-500 rounded-full ring-8 ring-white flex items-center justify-center">
                    <svg class="text-white h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
</svg>
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1 py-0">
                <div class="text-md text-gray-500">
                  <div>
                    <span class="my-0.5 relative inline-flex items-center bg-white rounded-full border border-gray-300 px-3 py-0.5 text-sm">
                      <div class="absolute flex-shrink-0 flex items-center justify-center">
                        <span class="h-2 w-2 rounded-full bg-green-500" aria-hidden="true"></span>
                      </div>
                      <div class="ml-3.5 font-medium text-gray-900">Features & Supported ESW Integrations

</div>
                    </a>
                  </div>
                  <span class="whitespace-nowrap text-sm"></span>
                </div>
                <div class="mt-2 text-gray-700 dark:text-neutral-300">
                  <ul>
            <li>ABTasty integration: Retailers can define and manage their A/B tests and personalization campaigns directly within the AB Tasty platform. Once configured, these tests and campaigns are seamlessly applied to the storefront, enabling dynamic content adjustments and user experience optimizations.</li>
            <li>Net and Gross site taxation support for ESW orders: ESW cartridge now supports both net and gross site taxation models.</li>
          </ul>
                </div>
              </div>
            </div>
          </div>
<!-- Feature Entry 2 (Duplicate) -->

<div class="relative pb-8">
            <span class="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
            <div class="relative flex items-start space-x-3">
              <div>
                <div class="relative px-1">
                  <div class="h-8 w-8 bg-blue-500 rounded-full ring-8 ring-white flex items-center justify-center">
                    <svg class="text-white h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
</svg>
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1 py-0">
                <div class="text-md text-gray-500">
                  <div>
                    <span class="font-medium text-gray-900 mr-2"></span>
                    <span class="my-0.5 relative inline-flex items-center bg-white rounded-full border border-gray-300 px-3 py-0.5 text-sm">
                      <div class="absolute flex-shrink-0 flex items-center justify-center">
                        <span class="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true"></span>
                      </div>
                      <div class="ml-3.5 font-medium text-gray-900">Enhancements</div>
                    </a>
                  </div>
                  <span class="whitespace-nowrap text-sm"></span>
                </div>
                <div class="mt-2 text-gray-700 dark:text-white">
                  <ul>
            <li>Default currency code for the selected country is now used if for any reason the esw.currency cookie is set to null.</li>
            <li>New custom attributes are added to support the native Japanese first name and last name, and article-level charges.</li>
            <li>BM cartridge updated to conditionally display the SFTP or API catalog configuration fields based on the value of feature switch isEswCatalogFeatureEnabled</li>
            <li>Job eswRetailerCatalogFeed is updated to sync catalog using Catalog API if feature flag isEswCatalogFeatureEnabled is set to true and to sync catalog data using SFTP when it is set to false.</li>
            <li>Implemented backend logic to support cart rebuild functionality in the headless (OCAPI) cartridge.</li>
          </ul>
                </div>
              </div>
            </div>
          </div>

<div class="relative pb-8">
            <span class="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
            <div class="relative flex items-start space-x-3">
              <div>
                <div class="relative px-1">
                  <div class="h-8 w-8 bg-blue-500 rounded-full ring-8 ring-white flex items-center justify-center">
                    <svg class="text-white h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
</svg>
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1 py-0">
                <div class="text-md text-gray-500">
                  <div>
                    <span class="font-medium text-gray-900 mr-2"></span>
                    <span class="my-0.5 relative inline-flex items-center bg-white rounded-full border border-gray-300 px-3 py-0.5 text-sm">
                      <div class="absolute flex-shrink-0 flex items-center justify-center">
                        <span class="h-2 w-2 rounded-full bg-red-500" aria-hidden="true"></span>
                      </div>
                      <div class="ml-3.5 font-medium text-gray-900">Bug Fixes</div>
                    </a>
                  </div>
                  <span class="whitespace-nowrap text-sm"></span>
                </div>
                <div class="mt-2 text-gray-700 dark:text-white">
                  <ul>
            <li>Resolved an issue where an error occurred during order creation if the shipping method was not set at basket creation for OCAPI.</li>
            <li>Resolved an issue where the default address didn’t show up as the first address on checkout for registered shoppers.</li>
          </ul>
                </div>
              </div>
            </div>
          </div>

<div class="relative pb-8">
            <span class="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
            <div class="relative flex items-start space-x-3">
              <div>
                <div class="relative px-1">
                  <div class="h-8 w-8 bg-blue-500 rounded-full ring-8 ring-white flex items-center justify-center">
                    <svg class="text-white h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
</svg>
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1 py-0">
                <div class="text-md text-gray-500">
                  <div>
                    <span class="font-medium text-gray-900 mr-2"></span>
                    <span class="my-0.5 relative inline-flex items-center bg-white rounded-full border border-gray-300 px-3 py-0.5 text-sm">
                      <div class="absolute flex-shrink-0 flex items-center justify-center">
                        <span class="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true"></span>
                      </div>
                      <div class="ml-3.5 font-medium text-gray-900">Removed</div>
                    </a>
                  </div>
                  <span class="whitespace-nowrap text-sm"></span>
                </div>
                <div class="mt-2 text-gray-700 dark:text-white">
                  <ul>
            <li>The deprecated `httpRequest` method is removed from the ESW SFCC Cartridge</li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</div>

---

<br>

  
#### Configuration/System Object Enhancements

- Line Item Custom attributes  
- ESW Article Charges

#### Shipping Address Custom attributes

- Native First Name for Japanese  
- Native Last Name for Japanese

#### Custom Site Preferences - ESW Retailer Display Configuration:

- ESW AB Tasty Script Path

<br>

## v4.7.0

<br>

:badge[2025-06-27]{variant="secondary"}