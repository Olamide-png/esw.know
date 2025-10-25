<template>
  <div class="w-full overflow-x-auto px-4 py-6">
    <!-- Header and Search -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Supported Payment Methods
        </h2>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          Search and explore payment methods by country.
        </p>
      </div>
      <div class="md:w-1/3">
        <input
          type="text"
          v-model="search"
          placeholder="Search by country or method..."
          class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <!-- Table -->
    <table class="min-w-full text-sm text-left border-collapse">
      <thead class="bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
        <tr>
          <th class="px-4 py-2 border">Country</th>
          <th class="px-4 py-2 border">Payment Methods</th>
          <th class="px-4 py-2 border">Extended Options</th>
          <th class="px-4 py-2 border">Special Setup</th>
          <th class="px-4 py-2 border">Shopify Support</th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
        <tr
          v-for="row in filteredRows"
          :key="row.country"
          class="border-t border-neutral-300 dark:border-neutral-700"
        >
          <td class="px-4 py-2 align-top">{{ row.country }}</td>
          <td class="px-4 py-2 align-top flex flex-wrap gap-2">
            <template v-for="method in row.methods">
              <img
                v-if="logos[method]"
                :src="logos[method]"
                :alt="method"
                :title="method"
                class="inline h-6"
              />
              <span v-else class="inline-block mx-1">{{ method }}</span>
            </template>
          </td>
          <td class="px-4 py-2 align-top">{{ row.extended || '-' }}</td>
          <td class="px-4 py-2 align-top">{{ row.setup || '-' }}</td>
          <td class="px-4 py-2 align-top">{{ row.shopify || '-' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')

const paymentData = ref([
  {
    country: 'Afghanistan',
    methods: ['American Express', 'Mastercard', 'PayPal', 'Visa'],
    extended: '',
    setup: '',
    shopify: ''
  },
  {
    country: 'Aland Islands',
    methods: ['American Express', 'Bank Transfer', 'Diners', 'Mastercard', 'PayPal', 'Visa'],
    extended: '',
    setup: 'Inquire your CSM for further information',
    shopify: 'Not Supported in Shopify Native'
  },
  // ... more rows
])

const logos = {
  'American Express': 'https://img.icons8.com/?size=100&id=ikzPviNiCGWG&format=png&color=000000',
  Mastercard: 'https://img.icons8.com/?size=100&id=62765&format=png&color=000000',
  PayPal: 'https://img.icons8.com/?size=100&id=CaSfJLdM4LTY&format=png&color=000000',
  Visa: 'https://img.icons8.com/?size=100&id=5L3mKKshbyOf&format=png&color=000000',
  Diners: 'https://img.icons8.com/?size=100&id=Mn8obNOW0MaY&format=png&color=000000',
  'Bank Transfer': 'https://img.icons8.com/?size=100&id=UmSeQlQobP2B&format=png&color=000000',
  'Google Pay': 'https://img.icons8.com/?size=100&id=17949&format=png&color=000000',
  'Apple Pay': 'https://img.icons8.com/?size=100&id=62858&format=png&color=000000',
  'Amazon Pay': 'https://img.icons8.com/?size=100&id=2nt5XhjL7jBK&format=png&color=000000',
  Klarna: '/klarna-logo-black.svg',
  UnionPay: '/union-pay.svg',
  JCB: '/jcb-emblem-logo.svg',
  WeChat: '/wechat-3.svg'
}

const filteredRows = computed(() =>
  paymentData.value.filter(
    (row) =>
      row.country.toLowerCase().includes(search.value.toLowerCase()) ||
      row.methods.some((m) => m.toLowerCase().includes(search.value.toLowerCase()))
  )
)
</script>
