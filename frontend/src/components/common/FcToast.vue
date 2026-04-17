<script setup lang="ts">
defineProps<{
  message: string
  type: 'success' | 'error' | 'info'
}>()
</script>

<template>
  <div
    :class="[
      'glass-panel px-4 py-3 text-sm shadow-lg min-w-[260px] max-w-[400px] animate-slide-in',
      {
        'border-l-4 border-l-fc-green': type === 'success',
        'border-l-4 border-l-fc-red': type === 'error',
        'border-l-4 border-l-fc-accent': type === 'info',
      }
    ]"
  >
    <span class="text-fc-text-primary">{{ message }}</span>
  </div>
</template>

<style scoped>
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
