<script setup lang="ts">
import { computed } from 'vue'
import { useRequestStore } from '@/stores/request'
import FcKeyValueEditor from '@/components/common/FcKeyValueEditor.vue'
import type { KeyValuePair } from '@/api/types'

const req = useRequestStore()

// Store form data as KV pairs in bodyContent (JSON serialized)
const formPairs = computed<KeyValuePair[]>({
  get() {
    if (!req.bodyContent) return [{ key: '', value: '', enabled: true }]
    try {
      const parsed = JSON.parse(req.bodyContent)
      if (Array.isArray(parsed)) return parsed.length ? parsed : [{ key: '', value: '', enabled: true }]
      if (typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, value]) => ({ key, value: String(value), enabled: true }))
      }
    } catch { /* not json */ }
    return [{ key: '', value: '', enabled: true }]
  },
  set(val: KeyValuePair[]) {
    req.bodyContent = JSON.stringify(val)
  }
})
</script>

<template>
  <FcKeyValueEditor
    :model-value="formPairs"
    key-placeholder="Field name"
    value-placeholder="Field value"
    @update:model-value="formPairs = $event"
  />
</template>
