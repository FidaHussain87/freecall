<script setup lang="ts">
defineProps<{
  modelValue?: boolean
  label?: string
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label class="inline-flex items-center gap-2 cursor-pointer select-none">
    <div
      :class="[
        'w-4 h-4 rounded border flex items-center justify-center transition-all duration-150',
        modelValue
          ? 'bg-fc-accent border-fc-accent'
          : 'border-fc-border hover:border-fc-border-active'
      ]"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <svg v-if="modelValue" class="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 6l3 3 5-5" />
      </svg>
    </div>
    <span v-if="label" class="text-sm text-fc-text-secondary">{{ label }}</span>
  </label>
</template>
