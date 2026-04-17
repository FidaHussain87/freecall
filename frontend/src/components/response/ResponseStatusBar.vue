<script setup lang="ts">
import { computed } from 'vue'
import { useRequestStore } from '@/stores/request'
import { useFormatters } from '@/composables/useFormatters'

const req = useRequestStore()
const { formatTime, formatBytes, getStatusClass } = useFormatters()

const statusColor = computed(() => {
  const cls = getStatusClass(req.response?.status_code ?? null)
  const map: Record<string, string> = {
    success: 'var(--fc-green)',
    redirect: 'var(--fc-cyan)',
    warning: 'var(--fc-orange)',
    error: 'var(--fc-red)',
    info: 'var(--fc-cyan)',
  }
  return map[cls] || 'var(--fc-text-muted)'
})
</script>

<template>
  <div v-if="req.response" class="flex items-center gap-3 text-xs font-mono">
    <template v-if="req.response.error && !req.response.status_code">
      <span class="text-fc-red">Error</span>
    </template>
    <template v-else>
      <span
        class="px-2 py-0.5 rounded font-semibold"
        :style="{ color: statusColor, backgroundColor: statusColor + '15' }"
      >
        {{ req.response.status_code }} {{ req.response.status_text }}
      </span>
      <span class="text-fc-text-muted">{{ formatTime(req.response.time_ms) }}</span>
      <span class="text-fc-text-muted">{{ formatBytes(req.response.size_bytes) }}</span>
    </template>
  </div>
</template>
