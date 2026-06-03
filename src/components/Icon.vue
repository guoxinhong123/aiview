<script setup>
defineProps({
  name: { type: String, required: true }
})
</script>

<template>
  <svg v-if="name === 'menu'" class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 7h14M5 12h14M5 17h9" />
  </svg>
  <svg v-else-if="name === 'send'" class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 19V6M7 11l5-5 5 5" />
  </svg>
  <svg v-else-if="name === 'download'" class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v11m0 0 4-4m-4 4-4-4M4 19h16" />
  </svg>
  <svg v-else-if="name === 'upload'" class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 16V5m0 0-4 4m4-4 4 4M4 19h16" />
  </svg>
  <svg v-else-if="name === 'sparkle'" class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3 14.3 9.7 21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z" />
  </svg>
  <svg v-else-if="name === 'history'" class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v6h6M12 7v5l3 2" />
  </svg>
  <svg v-else-if="name === 'close'" class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
</template>
