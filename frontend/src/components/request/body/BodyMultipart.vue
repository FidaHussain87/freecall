<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import FcDropdown from '@/components/common/FcDropdown.vue'
import type { DropdownOption } from '@/components/common/FcDropdown.vue'

const req = useRequestStore()

const typeOptions: DropdownOption[] = [
  { value: 'text', label: 'Text' },
  { value: 'file', label: 'File' },
]

function updateField(index: number, field: string, value: any) {
  const updated = [...req.multipartFields]
  updated[index] = { ...updated[index], [field]: value }
  req.multipartFields = updated
}

function removeField(index: number) {
  const updated = req.multipartFields.filter((_, i) => i !== index)
  if (updated.length === 0) updated.push({ key: '', value: '', type: 'text', file: null, enabled: true })
  req.multipartFields = updated
}

function addField() {
  req.multipartFields = [...req.multipartFields, { key: '', value: '', type: 'text', file: null, enabled: true }]
}

function onFileChange(index: number, e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.[0]) updateField(index, 'file', files[0])
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(field, i) in req.multipartFields"
      :key="i"
      class="flex items-center gap-2"
    >
      <div
        class="w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all shrink-0"
        :class="field.enabled ? 'bg-fc-accent border-fc-accent' : 'border-fc-border'"
        @click="updateField(i, 'enabled', !field.enabled)"
      >
        <svg v-if="field.enabled" class="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 6l3 3 5-5" />
        </svg>
      </div>
      <input
        :value="field.key"
        placeholder="Field name"
        class="w-32 px-2 py-1.5 text-xs font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted"
        @input="updateField(i, 'key', ($event.target as HTMLInputElement).value)"
      />
      <div class="w-20">
        <FcDropdown
          :model-value="field.type"
          :options="typeOptions"
          @update:model-value="updateField(i, 'type', $event)"
        />
      </div>
      <template v-if="field.type === 'text'">
        <input
          :value="field.value"
          placeholder="Value"
          class="flex-1 px-2 py-1.5 text-xs font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted"
          @input="updateField(i, 'value', ($event.target as HTMLInputElement).value)"
        />
      </template>
      <template v-else>
        <div class="flex-1 flex items-center gap-2">
          <input type="file" class="text-xs text-fc-text-secondary" @change="onFileChange(i, $event)" />
          <span v-if="field.file" class="text-xs text-fc-text-muted truncate">{{ field.file.name }}</span>
        </div>
      </template>
      <button
        class="p-1 rounded text-fc-text-muted hover:text-fc-red hover:bg-fc-red/10 transition-colors shrink-0"
        @click="removeField(i)"
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
    <button
      class="text-xs text-fc-text-muted hover:text-fc-accent transition-colors px-2 py-1"
      @click="addField"
    >
      + Add field
    </button>
  </div>
</template>
