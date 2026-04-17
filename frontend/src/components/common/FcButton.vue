<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <button
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg select-none',
      'focus:outline-none focus:ring-2 focus:ring-fc-accent/40',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      {
        'px-4 py-1.5 text-xs': size === 'sm',
        'px-5 py-2 text-sm': !size || size === 'md',
        'px-6 py-2.5 text-base': size === 'lg',
      },
      {
        'bg-fc-accent text-white hover:bg-fc-accent-hover shadow-glow-sm': !variant || variant === 'primary',
        'glass-input text-fc-text-primary hover:bg-fc-bg-hover': variant === 'secondary',
        'bg-fc-red/20 text-fc-red border border-fc-red/30 hover:bg-fc-red/30': variant === 'danger',
        'text-fc-text-secondary hover:text-fc-text-primary hover:bg-fc-bg-hover': variant === 'ghost',
      }
    ]"
  >
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <slot />
  </button>
</template>
