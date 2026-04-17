<script setup lang="ts">
import { useRequestStore } from '@/stores/request'

const req = useRequestStore()
</script>

<template>
  <div class="p-3">
    <pre v-if="req.response?.body" class="text-xs font-mono text-fc-text-secondary whitespace-pre-wrap break-all">{{ req.response.body }}</pre>
    <div v-else class="flex items-center justify-center py-8 text-fc-text-muted text-sm">
      No response body
    </div>
  </div>
</template>
