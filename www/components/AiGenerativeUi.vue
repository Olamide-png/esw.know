<script setup lang="ts">
type Callout = { type:'callout', variant?: 'info'|'success'|'warning'|'error', title?:string, text?:string }
type Steps   = { type:'steps',  items: Array<{ title:string, detail?:string }> }
type Cards   = { type:'cards',  items: Array<{ title:string, description?:string, href?:string, icon?:string }> }
type Table   = { type:'table',  columns: string[], rows: Array<Array<string>> }
type List    = { type:'list',   ordered?: boolean, items: string[] }

type UISchema = Callout | Steps | Cards | Table | List
const props = defineProps<{ schema: UISchema }>()
</script>

<template>
  <!-- CALL0UT -->
  <div v-if="props.schema.type==='callout'" class="rounded-xl border p-3 md:p-4 bg-muted/40">
    <div class="flex items-start gap-2">
      <Icon
        :name="props.schema.variant==='success' ? 'lucide:check-circle2'
              : props.schema.variant==='warning' ? 'lucide:alert-triangle'
              : props.schema.variant==='error'   ? 'lucide:octagon-alert'
              : 'lucide:info'"
        class="h-5 w-5 mt-0.5"
      />
      <div>
        <div v-if="(props.schema as any).title" class="font-medium mb-1">{{ (props.schema as any).title }}</div>
        <p class="text-sm leading-6">{{ (props.schema as any).text }}</p>
      </div>
    </div>
  </div>

  <!-- STEPS -->
  <ol v-else-if="props.schema.type==='steps'" class="space-y-3">
    <li v-for="(s,i) in (props.schema as any).items" :key="i" class="rounded-lg border p-3">
      <div class="font-medium flex items-center gap-2">
        <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs">{{ i+1 }}</span>
        {{ s.title }}
      </div>
      <p v-if="s.detail" class="text-sm leading-6 mt-1 ml-8">{{ s.detail }}</p>
    </li>
  </ol>

  <!-- CARDS -->
  <div v-else-if="props.schema.type==='cards'" class="grid grid-cols-1 gap-3">
    <a
      v-for="(c,i) in (props.schema as any).items" :key="i"
      :href="c.href || '#'" target="_blank" rel="noopener"
      class="rounded-xl border p-4 hover:shadow-md transition block"
    >
      <div class="flex items-start gap-3">
        <Icon v-if="c.icon" :name="c.icon" class="h-5 w-5 mt-0.5 opacity-80" />
        <div>
          <div class="font-medium">{{ c.title }}</div>
          <p v-if="c.description" class="text-sm leading-6 opacity-90">{{ c.description }}</p>
        </div>
      </div>
    </a>
  </div>

  <!-- TABLE -->
  <div v-else-if="props.schema.type==='table'" class="overflow-x-auto rounded-lg border">
    <table class="min-w-full text-sm">
      <thead class="bg-muted/50">
        <tr>
          <th v-for="(h,hi) in (props.schema as any).columns" :key="hi" class="px-3 py-2 text-left font-medium">{{ h }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r,ri) in (props.schema as any).rows" :key="ri" class="odd:bg-background">
          <td v-for="(cell,ci) in r" :key="ci" class="px-3 py-2 align-top">{{ cell }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- LIST -->
  <ul v-else-if="props.schema.type==='list' && !(props.schema as any).ordered" class="list-disc pl-5 space-y-1">
    <li v-for="(t,i) in (props.schema as any).items" :key="i">{{ t }}</li>
  </ul>
  <ol v-else-if="props.schema.type==='list' && (props.schema as any).ordered" class="list-decimal pl-5 space-y-1">
    <li v-for="(t,i) in (props.schema as any).items" :key="i">{{ t }}</li>
  </ol>
</template>
