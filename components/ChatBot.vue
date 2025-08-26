<template>
  <div></div>
</template>

<script setup>
onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://widget.galichat.com/gali-embeded.min.js'
  script.setAttribute('chat-hash', 'o8gwxuqqbve3ehvz3gr04v')
  script.defer = true
  document.head.appendChild(script)
})
</script>