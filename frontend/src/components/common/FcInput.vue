<script setup lang="ts">
defineProps<{
  modelValue?: string
  placeholder?: string
  type?: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :value="modelValue"
    :type="type || 'text'"
    :placeholder="placeholder"
    :disabled="disabled"
    class="w-full px-3 py-2 text-sm font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted disabled:opacity-50"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
