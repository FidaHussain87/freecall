<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue?: File | null
  accept?: string
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: File | null]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  emit('update:modelValue', files?.[0] || null)
}

function clear() {
  emit('update:modelValue', null)
  if (inputRef.value) inputRef.value.value = ''
}
</script>

<template>
  <div class="flex items-center gap-3">
    <button
      class="px-3 py-1.5 text-xs glass-input text-fc-text-secondary hover:text-fc-text-primary hover:bg-fc-bg-hover transition-colors cursor-pointer"
      @click="inputRef?.click()"
    >
      {{ label || 'Choose file' }}
    </button>
    <span v-if="modelValue" class="text-xs text-fc-text-secondary truncate max-w-[200px]">
      {{ modelValue.name }}
    </span>
    <button
      v-if="modelValue"
      class="text-xs text-fc-text-muted hover:text-fc-red transition-colors"
      @click="clear"
    >
      Clear
    </button>
    <input ref="inputRef" type="file" :accept="accept" class="hidden" @change="onChange" />
  </div>
</template>
