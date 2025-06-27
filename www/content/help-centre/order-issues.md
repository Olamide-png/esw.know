---
title: "Order Queries"
description: Common order queries.
aside: false
prevNext: false
---



::tabs{variant="card"}
  ::div{label="Card Tab"}
  ### This is a card-style tab
  ::
  ::div{label="Tab 2" icon="lucide:atom"}
  This is Tab #2
  ::
  ```ts [Code Tab]
  console.log('Hello World!');
  ```
::

::tabs{variant="line"}
  ::div{label="Preview" class="border flex min-h-[200px] w-full justify-center p-10 items-center rounded-lg shadow-xs"}
    :badge[Badge]
  ::
  ::div{label="Code"}
    ```tsx
    import { Badge } from "@/components/ui/badge"

    export function BadgeDemo() {
      return <Badge>Badge</Badge>
    }
    ```
  ::
::

<!-- Component: Icon accordion -->
<section class="w-full divide-y rounded divide-slate-200">
  <details class="p-4 group" open>
    <summary class="[&::-webkit-details-marker]:hidden relative flex gap-4 pr-8 font-medium list-none cursor-pointer text-slate-700 focus-visible:outline-none group-hover:text-slate-800">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 stroke-emerald-500  shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-ac05 desc-ac05">
        <title id="title-ac05">Leading icon</title>
        <desc id="desc-ac05">Icon that describes the summary</desc>
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z" />
      </svg>
      What browsers are supported?
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute right-0 w-4 h-4 transition duration-300 top-1 stroke-slate-700 shrink-0 group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-ac06 desc-ac06">
        <title id="title-ac06">Open icon</title>
        <desc id="desc-ac06">icon that represents the state of the summary</desc>
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </summary>
    <p class="mt-4 text-slate-500">
      The components in Wind UI are designed to work in the latest, stable releases of all major browsers, including Chrome, Firefox, Safari, and Edge.
    </p>
  </details>
  <details class="p-4 group">
    <summary class="[&::-webkit-details-marker]:hidden relative flex gap-4 pr-8 font-medium list-none cursor-pointer text-slate-700 focus-visible:outline-none group-hover:text-slate-800">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 stroke-emerald-500  shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-ac07 desc-ac07">
        <title id="title-ac07">Leading icon</title>
        <desc id="desc-ac07">Icon that describes the summary</desc>
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
      </svg>
      Are the components only available in green?
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute right-0 w-4 h-4 transition duration-300 top-1 stroke-slate-700 shrink-0 group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-ac08 desc-ac08">
        <title id="title-ac08">Open icon</title>
        <desc id="desc-ac08">icon that represents the state of the summary</desc>
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </summary>
    <p class="mt-4 text-slate-500">
      All components are easily customizable to match your own project.
    </p>
  </details>
  <details class="p-4 group">
    <summary class="[&::-webkit-details-marker]:hidden relative flex gap-4 pr-8 font-medium list-none cursor-pointer text-slate-700 focus-visible:outline-none group-hover:text-slate-800">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 stroke-emerald-500  shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-ac09 desc-ac09">
        <title id="title-ac09">Leading icon</title>
        <desc id="desc-ac09">Icon that describes the summary</desc>
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
      Is WindUi open source?
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute right-0 w-4 h-4 transition duration-300 top-1 stroke-slate-700 shrink-0 group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-ac10 desc-ac10">
        <title id="title-ac10">Open icon</title>
        <desc id="desc-ac10">icon that represents the state of the summary</desc>
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </summary>
    <p class="mt-4 text-slate-500">
      WindUI is not an open source project yet, but we don't guarantee that it won't become in the future.
    </p>
  </details>
  <details class="p-4 group">
    <summary class="[&::-webkit-details-marker]:hidden relative flex gap-4 pr-8 font-medium list-none cursor-pointer text-slate-700 focus-visible:outline-none group-hover:text-slate-800">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 stroke-emerald-500  shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-ac11 desc-ac11">
        <title id="title-ac11">Leading icon</title>
        <desc id="desc-ac11">Icon that describes the summary</desc>
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
      How can I help improve WindUI?
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute right-0 w-4 h-4 transition duration-300 top-1 stroke-slate-700 shrink-0 group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-ac12 desc-ac12">
        <title id="title-ac12">Open icon</title>
        <desc id="desc-ac12">icon that represents the state of the summary</desc>
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </summary>
    <p class="mt-4 text-slate-500">
      You can help our team improve WindUI by giving us feedback on our discord channel.
    </p>
  </details>
</section>
<!-- End Icon accordion -->



<!-- Component: Basic lg sized tab with leading icon -->
<section class="max-w-full" aria-multiselectable="false">
  <ul class="flex items-center border-b border-slate-200" role="tablist">
    <li role="presentation">
      <button class="inline-flex items-center justify-center w-full h-12 gap-2 px-6 -mb-px text-sm font-medium tracking-wide transition duration-300 border-b-2 rounded-t focus-visible:outline-none whitespace-nowrap border-emerald-500 hover:border-emerald-600 focus:border-emerald-700 text-emerald-500 hover:text-emerald-600 focus:text-emerald-700 hover:bg-emerald-50 focus:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-500 stroke-emerald-500 hover:stroke-emerald-600 focus:stroke-emerald-700" id="tab-label-1ai" role="tab" aria-setsize="3" aria-posinset="1" tabindex="0" aria-controls="tab-panel-1ai" aria-selected="true">
        <span class="order-2 ">Tab 1</span>
        <span class="relative only:-mx-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="hidden w-6 h-6 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-77a desc-77a">
            <title id="title-77a">Icon title</title>
            <desc id="desc-77a">
              A more detailed description of the icon
            </desc>
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </span>
      </button>
    </li>
    <li role="presentation">
      <button class="inline-flex items-center justify-center w-full h-12 gap-2 px-6 -mb-px text-sm font-medium tracking-wide transition duration-300 border-b-2 border-transparent rounded-t focus-visible:outline-none justify-self-center hover:border-emerald-500 focus:border-emerald-600 whitespace-nowrap text-slate-700 stroke-slate-700 hover:bg-emerald-50 hover:text-emerald-500 focus:stroke-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 hover:stroke-emerald-600 disabled:cursor-not-allowed disabled:text-slate-500" id="tab-label-2ai" role="tab" aria-setsize="3" aria-posinset="2" tabindex="-1" aria-controls="tab-panel-2ai" aria-selected="false">
        <span class="order-2 ">Tab 2</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="hidden w-6 h-6 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-77b desc-77b">
          <title id="title-77b">Icon title</title>
          <desc id="desc-77b">
            A more detailed description of the icon
          </desc>
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </button>
    </li>
    <li role="presentation">
      <button class="inline-flex items-center justify-center w-full h-12 gap-2 px-6 -mb-px text-sm font-medium tracking-wide transition duration-300 border-b-2 border-transparent rounded-t focus-visible:outline-none justify-self-center hover:border-emerald-500 focus:border-emerald-600 whitespace-nowrap text-slate-700 stroke-slate-700 hover:bg-emerald-50 hover:text-emerald-500 focus:stroke-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 hover:stroke-emerald-600 disabled:cursor-not-allowed disabled:text-slate-500" id="tab-label-3ai" role="tab" aria-setsize="3" aria-posinset="3" tabindex="-1" aria-controls="tab-panel-3ai" aria-selected="false">
        <span class="order-2 ">Tab 3</span>
        <span class="relative only:-mx-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="hidden w-6 h-6 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-labelledby="title-77c desc-77c">
            <title id="title-77c">Icon title</title>
            <desc id="desc-77c">
              A more detailed description of the icon
            </desc>
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </span>
      </button>
    </li>
  </ul>
  <div>
    <div class="px-6 py-4" id="tab-panel-1ai" aria-hidden="false" role="tabpanel" aria-labelledby="tab-label-1ai" tabindex="-1">
      <p>
        What is the recipe for successful achievement? To my mind there are just four essential ingredients: Choose a career you love, give it the best there is in you, seize your opportunities, and be a member of the team.
      </p>
    </div>
    <div class="hidden px-6 py-4" id="tab-panel-2ai" aria-hidden="true" role="tabpanel" aria-labelledby="tab-label-2ai" tabindex="-1">
      <p>
        One must be entirely sensitive to the structure of the material that one is handling. One must yield to it in tiny details of execution, perhaps the handling of the surface or grain, and one must master it as a whole.
      </p>

    </div>
    <div class="hidden px-6 py-4" id="tab-panel-3ai" aria-hidden="true" role="tabpanel" aria-labelledby="tab-label-3ai" tabindex="-1">
      <p>
        Even though there is no certainty that the expected results of our work will manifest, we have to remain committed to our work and duties; because, even if the results are slated to arrive, they cannot do so without the performance of work.
      </p>
    </div>
  </div>
</section>
<!-- End Basic lg sized tab with leading icon -->



<div class="p-4">
      <div class="space-y-4 max-w-5xl mx-auto mt-4">
        <div class="[box-shadow:0_2px_10px_-3px_rgba(6,81,237,0.3)] rounded-lg border-l-8 border-blue-700" role="accordion">
          <button type="button"
            class="accordion-button cursor-pointer w-full text-[15px] font-semibold text-left py-5 px-6 text-blue-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="fill-current w-8 mr-4 shrink-0" viewBox="0 0 512 512">
              <path
                d="M227.656 357.508a15.13 15.13 0 0 0 10.692 4.426c4.007 0 7.851-1.59 10.687-4.426l53.973-53.973c5.906-5.906 5.906-15.476 0-21.383-5.903-5.902-15.477-5.902-21.38 0l-43.28 43.282-19.735-19.735c-5.906-5.902-15.476-5.902-21.383 0-5.902 5.903-5.902 15.477 0 21.383zm0 0"
                data-original="#000000" />
              <path
                d="M250.121 439.844c66.176 0 120.012-53.84 120.012-120.016S316.297 199.816 250.12 199.816c-66.18 0-120.016 53.836-120.016 120.012s53.84 120.016 120.016 120.016zm0-209.793c49.504 0 89.777 40.273 89.777 89.777s-40.273 89.781-89.777 89.781-89.781-40.277-89.781-89.78 40.277-89.778 89.781-89.778zm0 0"
                data-original="#000000" />
              <path
                d="M451.344 32.191H423.77V15.117C423.77 6.77 417 0 408.652 0s-15.117 6.77-15.117 15.117v17.074h-29.707V15.117C363.828 6.77 357.058 0 348.707 0c-8.348 0-15.117 6.77-15.117 15.117v17.074H166.652V15.117c0-8.347-6.77-15.117-15.12-15.117-8.348 0-15.118 6.77-15.118 15.117v17.074h-29.707V15.117C106.707 6.77 99.937 0 91.586 0c-8.348 0-15.117 6.77-15.117 15.117v17.074H48.89C21.934 32.191 0 54.125 0 81.086v382.023C0 490.066 21.934 512 48.89 512h402.454c26.96 0 48.89-21.934 48.89-48.89V81.085c0-26.961-21.933-48.895-48.89-48.895zm18.652 430.918c0 10.286-8.367 18.657-18.652 18.657H48.89c-10.286 0-18.657-8.371-18.657-18.657V157.9h439.762zM30.234 81.086c0-10.29 8.371-18.656 18.657-18.656h27.578v17.074c0 8.348 6.77 15.117 15.12 15.117 8.348 0 15.118-6.77 15.118-15.117V62.43h29.707v17.074c0 8.348 6.77 15.117 15.121 15.117 8.348 0 15.117-6.77 15.117-15.117V62.43H333.59v17.074c0 8.348 6.77 15.117 15.12 15.117 8.349 0 15.118-6.77 15.118-15.117V62.43h29.707v17.074c0 8.348 6.77 15.117 15.117 15.117 8.352 0 15.121-6.77 15.121-15.117V62.43h27.57C461.63 62.43 470 70.797 470 81.086v46.574H30.234zm0 0"
                data-original="#000000" />
            </svg>
            <span class="mr-4">Are there any special discounts or promotions available during the event.
              <span class="text-xs text-slate-600 mt-0.5 block font-normal">Lorem ipsum dolor sit amet, consectetur
                adipiscing elit.</span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg"
              class="w-[14px] h-[14px] arrow fill-current ml-auto shrink-0 transition-all duration-300 rotate-180"
              viewBox="0 0 24 24">
              <path fill-rule="evenodd"
                d="M11.99997 18.1669a2.38 2.38 0 0 1-1.68266-.69733l-9.52-9.52a2.38 2.38 0 1 1 3.36532-3.36532l7.83734 7.83734 7.83734-7.83734a2.38 2.38 0 1 1 3.36532 3.36532l-9.52 9.52a2.38 2.38 0 0 1-1.68266.69734z"
                clip-rule="evenodd" data-original="#000000"></path>
            </svg>
          </button>

  <div class="accordion-content overflow-hidden transition-all duration-300 ease-in-out">
            <div class="pb-5 px-6">
              <p class="text-sm text-slate-600 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                auctor auctor arcu,
                at fermentum dui. Maecenas
                vestibulum a turpis in lacinia. Proin aliquam turpis at erat venenatis malesuada. Sed semper, justo vitae
                consequat fermentum, felis diam posuere ante, sed fermentum quam justo in dui. Nulla facilisi. Nulla aliquam
                auctor purus, vitae dictum dolor sollicitudin vitae. Sed bibendum purus in efficitur consequat. Fusce et
                tincidunt arcu. Curabitur ac lacus lectus. Morbi congue facilisis sapien, a semper orci facilisis in.
              </p>
            </div>
          </div>
        </div>

  <div class="[box-shadow:0_2px_10px_-3px_rgba(6,81,237,0.3)] rounded-lg border-l-8 border-blue-700" role="accordion">
          <button type="button"
            class="accordion-button cursor-pointer w-full text-[15px] font-semibold text-left py-5 px-6 text-slate-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="fill-current w-8 mr-4 shrink-0" viewBox="0 0 512 512">
              <path
                d="M227.656 357.508a15.13 15.13 0 0 0 10.692 4.426c4.007 0 7.851-1.59 10.687-4.426l53.973-53.973c5.906-5.906 5.906-15.476 0-21.383-5.903-5.902-15.477-5.902-21.38 0l-43.28 43.282-19.735-19.735c-5.906-5.902-15.476-5.902-21.383 0-5.902 5.903-5.902 15.477 0 21.383zm0 0"
                data-original="#000000" />
              <path
                d="M250.121 439.844c66.176 0 120.012-53.84 120.012-120.016S316.297 199.816 250.12 199.816c-66.18 0-120.016 53.836-120.016 120.012s53.84 120.016 120.016 120.016zm0-209.793c49.504 0 89.777 40.273 89.777 89.777s-40.273 89.781-89.777 89.781-89.781-40.277-89.781-89.78 40.277-89.778 89.781-89.778zm0 0"
                data-original="#000000" />
              <path
                d="M451.344 32.191H423.77V15.117C423.77 6.77 417 0 408.652 0s-15.117 6.77-15.117 15.117v17.074h-29.707V15.117C363.828 6.77 357.058 0 348.707 0c-8.348 0-15.117 6.77-15.117 15.117v17.074H166.652V15.117c0-8.347-6.77-15.117-15.12-15.117-8.348 0-15.118 6.77-15.118 15.117v17.074h-29.707V15.117C106.707 6.77 99.937 0 91.586 0c-8.348 0-15.117 6.77-15.117 15.117v17.074H48.89C21.934 32.191 0 54.125 0 81.086v382.023C0 490.066 21.934 512 48.89 512h402.454c26.96 0 48.89-21.934 48.89-48.89V81.085c0-26.961-21.933-48.895-48.89-48.895zm18.652 430.918c0 10.286-8.367 18.657-18.652 18.657H48.89c-10.286 0-18.657-8.371-18.657-18.657V157.9h439.762zM30.234 81.086c0-10.29 8.371-18.656 18.657-18.656h27.578v17.074c0 8.348 6.77 15.117 15.12 15.117 8.348 0 15.118-6.77 15.118-15.117V62.43h29.707v17.074c0 8.348 6.77 15.117 15.121 15.117 8.348 0 15.117-6.77 15.117-15.117V62.43H333.59v17.074c0 8.348 6.77 15.117 15.12 15.117 8.349 0 15.118-6.77 15.118-15.117V62.43h29.707v17.074c0 8.348 6.77 15.117 15.117 15.117 8.352 0 15.121-6.77 15.121-15.117V62.43h27.57C461.63 62.43 470 70.797 470 81.086v46.574H30.234zm0 0"
                data-original="#000000" />
            </svg>
            <span class="mr-4">What are the dates and locations for the product launch events?
              <span class="text-xs text-slate-600 mt-0.5 block font-normal">Lorem ipsum dolor sit amet, consectetur
                adipiscing elit.</span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg"
              class="w-[14px] h-[14px] arrow fill-current ml-auto shrink-0 transition-all duration-300" viewBox="0 0 24 24">
              <path fill-rule="evenodd"
                d="M11.99997 18.1669a2.38 2.38 0 0 1-1.68266-.69733l-9.52-9.52a2.38 2.38 0 1 1 3.36532-3.36532l7.83734 7.83734 7.83734-7.83734a2.38 2.38 0 1 1 3.36532 3.36532l-9.52 9.52a2.38 2.38 0 0 1-1.68266.69734z"
                clip-rule="evenodd" data-original="#000000"></path>
            </svg>
          </button>

  <div class="accordion-content overflow-hidden max-h-0 transition-all duration-300 ease-in-out">
            <div class="pb-5 px-6">
              <p class="text-sm text-slate-600 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                auctor auctor arcu,
                at fermentum dui. Maecenas
                vestibulum a turpis in lacinia. Proin aliquam turpis at erat venenatis malesuada. Sed semper, justo vitae
                consequat fermentum, felis diam posuere ante, sed fermentum quam justo in dui. Nulla facilisi. Nulla aliquam
                auctor purus, vitae dictum dolor sollicitudin vitae. Sed bibendum purus in efficitur consequat. Fusce et
                tincidunt arcu. Curabitur ac lacus lectus. Morbi congue facilisis sapien, a semper orci facilisis in.</p>
            </div>
          </div>
        </div>

  <div class="[box-shadow:0_2px_10px_-3px_rgba(6,81,237,0.3)] rounded-lg border-l-8 border-blue-700" role="accordion">
          <button type="button"
            class="accordion-button cursor-pointer w-full text-[15px] font-semibold text-left py-5 px-6 text-slate-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="fill-current w-8 mr-4 shrink-0" viewBox="0 0 512 512">
              <path
                d="M227.656 357.508a15.13 15.13 0 0 0 10.692 4.426c4.007 0 7.851-1.59 10.687-4.426l53.973-53.973c5.906-5.906 5.906-15.476 0-21.383-5.903-5.902-15.477-5.902-21.38 0l-43.28 43.282-19.735-19.735c-5.906-5.902-15.476-5.902-21.383 0-5.902 5.903-5.902 15.477 0 21.383zm0 0"
                data-original="#000000" />
              <path
                d="M250.121 439.844c66.176 0 120.012-53.84 120.012-120.016S316.297 199.816 250.12 199.816c-66.18 0-120.016 53.836-120.016 120.012s53.84 120.016 120.016 120.016zm0-209.793c49.504 0 89.777 40.273 89.777 89.777s-40.273 89.781-89.777 89.781-89.781-40.277-89.781-89.78 40.277-89.778 89.781-89.778zm0 0"
                data-original="#000000" />
              <path
                d="M451.344 32.191H423.77V15.117C423.77 6.77 417 0 408.652 0s-15.117 6.77-15.117 15.117v17.074h-29.707V15.117C363.828 6.77 357.058 0 348.707 0c-8.348 0-15.117 6.77-15.117 15.117v17.074H166.652V15.117c0-8.347-6.77-15.117-15.12-15.117-8.348 0-15.118 6.77-15.118 15.117v17.074h-29.707V15.117C106.707 6.77 99.937 0 91.586 0c-8.348 0-15.117 6.77-15.117 15.117v17.074H48.89C21.934 32.191 0 54.125 0 81.086v382.023C0 490.066 21.934 512 48.89 512h402.454c26.96 0 48.89-21.934 48.89-48.89V81.085c0-26.961-21.933-48.895-48.89-48.895zm18.652 430.918c0 10.286-8.367 18.657-18.652 18.657H48.89c-10.286 0-18.657-8.371-18.657-18.657V157.9h439.762zM30.234 81.086c0-10.29 8.371-18.656 18.657-18.656h27.578v17.074c0 8.348 6.77 15.117 15.12 15.117 8.348 0 15.118-6.77 15.118-15.117V62.43h29.707v17.074c0 8.348 6.77 15.117 15.121 15.117 8.348 0 15.117-6.77 15.117-15.117V62.43H333.59v17.074c0 8.348 6.77 15.117 15.12 15.117 8.349 0 15.118-6.77 15.118-15.117V62.43h29.707v17.074c0 8.348 6.77 15.117 15.117 15.117 8.352 0 15.121-6.77 15.121-15.117V62.43h27.57C461.63 62.43 470 70.797 470 81.086v46.574H30.234zm0 0"
                data-original="#000000" />
            </svg>
            <span class="mr-4">Can I bring a guest with me to the product launch event?
              <span class="text-xs text-slate-600 mt-0.5 block font-normal">Lorem ipsum dolor sit amet, consectetur
                adipiscing elit.</span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg"
              class="w-[14px] h-[14px] arrow fill-current ml-auto shrink-0 transition-all duration-300" viewBox="0 0 24 24">
              <path fill-rule="evenodd"
                d="M11.99997 18.1669a2.38 2.38 0 0 1-1.68266-.69733l-9.52-9.52a2.38 2.38 0 1 1 3.36532-3.36532l7.83734 7.83734 7.83734-7.83734a2.38 2.38 0 1 1 3.36532 3.36532l-9.52 9.52a2.38 2.38 0 0 1-1.68266.69734z"
                clip-rule="evenodd" data-original="#000000"></path>
            </svg>
          </button>

  <div class="accordion-content overflow-hidden max-h-0 transition-all duration-300 ease-in-out">
            <div class="pb-5 px-6">
              <p class="text-sm text-slate-600 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                auctor auctor arcu,
                at fermentum dui. Maecenas
                vestibulum a turpis in lacinia. Proin aliquam turpis at erat venenatis malesuada. Sed semper, justo vitae
                consequat fermentum, felis diam posuere ante, sed fermentum quam justo in dui. Nulla facilisi. Nulla aliquam
                auctor purus, vitae dictum dolor sollicitudin vitae. Sed bibendum purus in efficitur consequat. Fusce et
                tincidunt arcu. Curabitur ac lacus lectus. Morbi congue facilisis sapien, a semper orci facilisis in.</p>
            </div>
          </div>
        </div>

  <div class="[box-shadow:0_2px_10px_-3px_rgba(6,81,237,0.3)] rounded-lg border-l-8 border-blue-700" role="accordion">
          <button type="button"
            class="accordion-button cursor-pointer w-full text-[15px] font-semibold text-left py-5 px-6 text-slate-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="fill-current w-8 mr-4 shrink-0" viewBox="0 0 512 512">
              <path
                d="M227.656 357.508a15.13 15.13 0 0 0 10.692 4.426c4.007 0 7.851-1.59 10.687-4.426l53.973-53.973c5.906-5.906 5.906-15.476 0-21.383-5.903-5.902-15.477-5.902-21.38 0l-43.28 43.282-19.735-19.735c-5.906-5.902-15.476-5.902-21.383 0-5.902 5.903-5.902 15.477 0 21.383zm0 0"
                data-original="#000000" />
              <path
                d="M250.121 439.844c66.176 0 120.012-53.84 120.012-120.016S316.297 199.816 250.12 199.816c-66.18 0-120.016 53.836-120.016 120.012s53.84 120.016 120.016 120.016zm0-209.793c49.504 0 89.777 40.273 89.777 89.777s-40.273 89.781-89.777 89.781-89.781-40.277-89.781-89.78 40.277-89.778 89.781-89.778zm0 0"
                data-original="#000000" />
              <path
                d="M451.344 32.191H423.77V15.117C423.77 6.77 417 0 408.652 0s-15.117 6.77-15.117 15.117v17.074h-29.707V15.117C363.828 6.77 357.058 0 348.707 0c-8.348 0-15.117 6.77-15.117 15.117v17.074H166.652V15.117c0-8.347-6.77-15.117-15.12-15.117-8.348 0-15.118 6.77-15.118 15.117v17.074h-29.707V15.117C106.707 6.77 99.937 0 91.586 0c-8.348 0-15.117 6.77-15.117 15.117v17.074H48.89C21.934 32.191 0 54.125 0 81.086v382.023C0 490.066 21.934 512 48.89 512h402.454c26.96 0 48.89-21.934 48.89-48.89V81.085c0-26.961-21.933-48.895-48.89-48.895zm18.652 430.918c0 10.286-8.367 18.657-18.652 18.657H48.89c-10.286 0-18.657-8.371-18.657-18.657V157.9h439.762zM30.234 81.086c0-10.29 8.371-18.656 18.657-18.656h27.578v17.074c0 8.348 6.77 15.117 15.12 15.117 8.348 0 15.118-6.77 15.118-15.117V62.43h29.707v17.074c0 8.348 6.77 15.117 15.121 15.117 8.348 0 15.117-6.77 15.117-15.117V62.43H333.59v17.074c0 8.348 6.77 15.117 15.12 15.117 8.349 0 15.118-6.77 15.118-15.117V62.43h29.707v17.074c0 8.348 6.77 15.117 15.117 15.117 8.352 0 15.121-6.77 15.121-15.117V62.43h27.57C461.63 62.43 470 70.797 470 81.086v46.574H30.234zm0 0"
                data-original="#000000" />
            </svg>
            <span class="mr-4">How can I access the presentation materials after the event?
              <span class="text-xs text-slate-600 mt-0.5 block font-normal">Lorem ipsum dolor sit amet, consectetur
                adipiscing elit.</span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg"
              class="w-[14px] h-[14px] arrow fill-current ml-auto shrink-0 transition-all duration-300" viewBox="0 0 24 24">
              <path fill-rule="evenodd"
                d="M11.99997 18.1669a2.38 2.38 0 0 1-1.68266-.69733l-9.52-9.52a2.38 2.38 0 1 1 3.36532-3.36532l7.83734 7.83734 7.83734-7.83734a2.38 2.38 0 1 1 3.36532 3.36532l-9.52 9.52a2.38 2.38 0 0 1-1.68266.69734z"
                clip-rule="evenodd" data-original="#000000"></path>
            </svg>
          </button>

  <div class="accordion-content overflow-hidden max-h-0 transition-all duration-300 ease-in-out">
            <div class="pb-5 px-6">
              <p class="text-sm text-slate-600 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                auctor auctor arcu,
                at fermentum dui. Maecenas
                vestibulum a turpis in lacinia. Proin aliquam turpis at erat venenatis malesuada. Sed semper, justo vitae
                consequat fermentum, felis diam posuere ante, sed fermentum quam justo in dui. Nulla facilisi. Nulla aliquam
                auctor purus, vitae dictum dolor sollicitudin vitae. Sed bibendum purus in efficitur consequat. Fusce et
                tincidunt arcu. Curabitur ac lacus lectus. Morbi congue facilisis sapien, a semper orci facilisis in.</p>
            </div>
          </div>
        </div>

  <div class="[box-shadow:0_2px_10px_-3px_rgba(6,81,237,0.3)] rounded-lg border-l-8 border-blue-700" role="accordion">
          <button type="button"
            class="accordion-button cursor-pointer w-full text-[15px] font-semibold text-left py-5 px-6 text-slate-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="fill-current w-8 mr-4 shrink-0" viewBox="0 0 512 512">
              <path
                d="M227.656 357.508a15.13 15.13 0 0 0 10.692 4.426c4.007 0 7.851-1.59 10.687-4.426l53.973-53.973c5.906-5.906 5.906-15.476 0-21.383-5.903-5.902-15.477-5.902-21.38 0l-43.28 43.282-19.735-19.735c-5.906-5.902-15.476-5.902-21.383 0-5.902 5.903-5.902 15.477 0 21.383zm0 0"
                data-original="#000000" />
              <path
                d="M250.121 439.844c66.176 0 120.012-53.84 120.012-120.016S316.297 199.816 250.12 199.816c-66.18 0-120.016 53.836-120.016 120.012s53.84 120.016 120.016 120.016zm0-209.793c49.504 0 89.777 40.273 89.777 89.777s-40.273 89.781-89.777 89.781-89.781-40.277-89.781-89.78 40.277-89.778 89.781-89.778zm0 0"
                data-original="#000000" />
              <path
                d="M451.344 32.191H423.77V15.117C423.77 6.77 417 0 408.652 0s-15.117 6.77-15.117 15.117v17.074h-29.707V15.117C363.828 6.77 357.058 0 348.707 0c-8.348 0-15.117 6.77-15.117 15.117v17.074H166.652V15.117c0-8.347-6.77-15.117-15.12-15.117-8.348 0-15.118 6.77-15.118 15.117v17.074h-29.707V15.117C106.707 6.77 99.937 0 91.586 0c-8.348 0-15.117 6.77-15.117 15.117v17.074H48.89C21.934 32.191 0 54.125 0 81.086v382.023C0 490.066 21.934 512 48.89 512h402.454c26.96 0 48.89-21.934 48.89-48.89V81.085c0-26.961-21.933-48.895-48.89-48.895zm18.652 430.918c0 10.286-8.367 18.657-18.652 18.657H48.89c-10.286 0-18.657-8.371-18.657-18.657V157.9h439.762zM30.234 81.086c0-10.29 8.371-18.656 18.657-18.656h27.578v17.074c0 8.348 6.77 15.117 15.12 15.117 8.348 0 15.118-6.77 15.118-15.117V62.43h29.707v17.074c0 8.348 6.77 15.117 15.121 15.117 8.348 0 15.117-6.77 15.117-15.117V62.43H333.59v17.074c0 8.348 6.77 15.117 15.12 15.117 8.349 0 15.118-6.77 15.118-15.117V62.43h29.707v17.074c0 8.348 6.77 15.117 15.117 15.117 8.352 0 15.121-6.77 15.121-15.117V62.43h27.57C461.63 62.43 470 70.797 470 81.086v46.574H30.234zm0 0"
                data-original="#000000" />
            </svg>
            <span class="mr-4">Will there be food and refreshments provided at the event?
              <span class="text-xs text-slate-600 mt-0.5 block font-normal">Lorem ipsum dolor sit amet, consectetur
                adipiscing elit.</span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg"
              class="w-[14px] h-[14px] arrow fill-current ml-auto shrink-0 transition-all duration-300" viewBox="0 0 24 24">
              <path fill-rule="evenodd"
                d="M11.99997 18.1669a2.38 2.38 0 0 1-1.68266-.69733l-9.52-9.52a2.38 2.38 0 1 1 3.36532-3.36532l7.83734 7.83734 7.83734-7.83734a2.38 2.38 0 1 1 3.36532 3.36532l-9.52 9.52a2.38 2.38 0 0 1-1.68266.69734z"
                clip-rule="evenodd" data-original="#000000"></path>
            </svg>
          </button>

  <div class="accordion-content overflow-hidden max-h-0 transition-all duration-300 ease-in-out">
            <div class="pb-5 px-6">
              <p class="text-sm text-slate-600 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                auctor auctor arcu,
                at fermentum dui. Maecenas
                vestibulum a turpis in lacinia. Proin aliquam turpis at erat venenatis malesuada. Sed semper, justo vitae
                consequat fermentum, felis diam posuere ante, sed fermentum quam justo in dui. Nulla facilisi. Nulla aliquam
                auctor purus, vitae dictum dolor sollicitudin vitae. Sed bibendum purus in efficitur consequat. Fusce et
                tincidunt arcu. Curabitur ac lacus lectus. Morbi congue facilisis sapien, a semper orci facilisis in.</p>
            </div>
          </div>
        </div>
      </div>
    </div>