<script setup lang="ts">
defineProps<{
  method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'
  path: string
  baseUrl?: string
  defaults?: any
  allowMethodSwitch?: boolean
}>()
</script>

<template>
  <ApiEndpointTryIt
    :method="method"
    :path="path"
    :base-url="baseUrl"
    :defaults="defaults"
    :allow-method-switch="allowMethodSwitch"
  />
</template>
