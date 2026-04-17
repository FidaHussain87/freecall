<script setup lang="ts">
defineProps<{
  color?: string
  variant?: 'default' | 'method' | 'status'
}>()
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wide',
      variant === 'method' ? 'min-w-[52px] justify-center' : '',
    ]"
    :style="color ? { color, borderColor: color + '40', backgroundColor: color + '15' } : {}"
  >
    <slot />
  </span>
</template>
