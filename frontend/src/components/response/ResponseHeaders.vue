<script setup lang="ts">
import { computed } from 'vue'
import { useRequestStore } from '@/stores/request'

const req = useRequestStore()

const headerEntries = computed(() => {
  if (!req.response?.response_headers) return []
  return Object.entries(req.response.response_headers)
})
</script>

<template>
  <div class="p-3">
    <table v-if="headerEntries.length" class="w-full text-sm">
      <thead>
        <tr class="border-b border-fc-border">
          <th class="text-left py-2 px-2 text-xs text-fc-text-muted font-medium w-1/3">Header</th>
          <th class="text-left py-2 px-2 text-xs text-fc-text-muted font-medium">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[key, value] in headerEntries" :key="key" class="border-b border-fc-border/50">
          <td class="py-1.5 px-2 font-mono text-xs text-fc-accent">{{ key }}</td>
          <td class="py-1.5 px-2 font-mono text-xs text-fc-text-secondary break-all">{{ value }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="flex items-center justify-center py-8 text-fc-text-muted text-sm">
      No response headers
    </div>
  </div>
</template>
