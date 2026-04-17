<script setup lang="ts">
import type { KeyValuePair } from '@/api/types'

const props = defineProps<{
  modelValue: KeyValuePair[]
  keyPlaceholder?: string
  valuePlaceholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: KeyValuePair[]]
}>()

function update(index: number, field: keyof KeyValuePair, value: any) {
  const updated = [...props.modelValue]
  updated[index] = { ...updated[index], [field]: value }
  emit('update:modelValue', updated)
}

function remove(index: number) {
  const updated = props.modelValue.filter((_, i) => i !== index)
  if (updated.length === 0) updated.push({ key: '', value: '', enabled: true })
  emit('update:modelValue', updated)
}

function addRow() {
  emit('update:modelValue', [...props.modelValue, { key: '', value: '', enabled: true }])
}
</script>

<template>
  <div class="space-y-1.5">
    <div
      v-for="(pair, i) in modelValue"
      :key="i"
      class="flex items-center gap-2"
    >
      <div
        class="w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all shrink-0"
        :class="pair.enabled ? 'bg-fc-accent border-fc-accent' : 'border-fc-border hover:border-fc-border-active'"
        @click="update(i, 'enabled', !pair.enabled)"
      >
        <svg v-if="pair.enabled" class="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 6l3 3 5-5" />
        </svg>
      </div>
      <input
        :value="pair.key"
        :placeholder="keyPlaceholder || 'Key'"
        class="flex-1 px-2 py-1.5 text-xs font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted"
        @input="update(i, 'key', ($event.target as HTMLInputElement).value)"
      />
      <input
        :value="pair.value"
        :placeholder="valuePlaceholder || 'Value'"
        class="flex-1 px-2 py-1.5 text-xs font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted"
        @input="update(i, 'value', ($event.target as HTMLInputElement).value)"
      />
      <button
        class="p-1 rounded text-fc-text-muted hover:text-fc-red hover:bg-fc-red/10 transition-colors shrink-0"
        @click="remove(i)"
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
    <button
      class="text-xs text-fc-text-muted hover:text-fc-accent transition-colors px-2 py-1"
      @click="addRow"
    >
      + Add row
    </button>
  </div>
</template>
