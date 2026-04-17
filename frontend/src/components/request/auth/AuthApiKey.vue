<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import FcDropdown from '@/components/common/FcDropdown.vue'
import type { DropdownOption } from '@/components/common/FcDropdown.vue'

const req = useRequestStore()

const locationOptions: DropdownOption[] = [
  { value: 'header', label: 'Header' },
  { value: 'query', label: 'Query Parameter' },
]
</script>

<template>
  <div class="space-y-3">
    <div>
      <label class="block text-xs text-fc-text-muted mb-1 font-medium">Key</label>
      <input
        :value="req.auth.api_key_key || ''"
        type="text"
        placeholder="e.g. X-API-Key"
        class="w-full px-3 py-2 text-sm font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted"
        @input="req.auth = { ...req.auth, api_key_key: ($event.target as HTMLInputElement).value }"
      />
    </div>
    <div>
      <label class="block text-xs text-fc-text-muted mb-1 font-medium">Value</label>
      <input
        :value="req.auth.api_key_value || ''"
        type="text"
        placeholder="API key value"
        class="w-full px-3 py-2 text-sm font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted"
        @input="req.auth = { ...req.auth, api_key_value: ($event.target as HTMLInputElement).value }"
      />
    </div>
    <div>
      <label class="block text-xs text-fc-text-muted mb-1 font-medium">Add to</label>
      <div class="w-48">
        <FcDropdown
          :model-value="req.auth.api_key_in || 'header'"
          :options="locationOptions"
          @update:model-value="req.auth = { ...req.auth, api_key_in: $event as any }"
        />
      </div>
    </div>
  </div>
</template>
