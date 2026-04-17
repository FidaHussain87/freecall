<script setup lang="ts">
defineProps<{
  tabs: { key: string; label: string; count?: number }[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex border-b border-fc-border">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="[
        'px-4 py-2 text-sm font-medium transition-all duration-150 relative',
        modelValue === tab.key
          ? 'text-fc-accent'
          : 'text-fc-text-muted hover:text-fc-text-secondary'
      ]"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
      <span v-if="tab.count" class="ml-1.5 text-xs opacity-60">({{ tab.count }})</span>
      <div
        v-if="modelValue === tab.key"
        class="absolute bottom-0 left-0 right-0 h-0.5 bg-fc-accent rounded-t"
      />
    </button>
  </div>
</template>
