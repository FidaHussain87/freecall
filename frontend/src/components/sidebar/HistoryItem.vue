<script setup lang="ts">
import { computed } from 'vue'
import type { HistoryEntry } from '@/api/types'
import { useRequestStore } from '@/stores/request'
import { useFormatters } from '@/composables/useFormatters'

const props = defineProps<{
  entry: HistoryEntry
}>()

const reqStore = useRequestStore()
const { timeAgo, truncateUrl } = useFormatters()

const methodColor = computed(() => {
  const map: Record<string, string> = {
    GET: 'var(--fc-method-get)',
    POST: 'var(--fc-method-post)',
    PUT: 'var(--fc-method-put)',
    PATCH: 'var(--fc-method-patch)',
    DELETE: 'var(--fc-method-delete)',
    HEAD: 'var(--fc-method-head)',
    OPTIONS: 'var(--fc-method-options)',
  }
  return map[props.entry.method] || 'var(--fc-text-muted)'
})

const statusColor = computed(() => {
  const code = props.entry.status_code
  if (!code) return 'var(--fc-red)'
  if (code < 300) return 'var(--fc-green)'
  if (code < 400) return 'var(--fc-cyan)'
  if (code < 500) return 'var(--fc-orange)'
  return 'var(--fc-red)'
})

function load() {
  reqStore.loadFromHistory(props.entry)
}
</script>

<template>
  <div
    class="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-fc-bg-hover transition-colors"
    @click="load"
  >
    <span
      class="text-[10px] font-mono font-bold uppercase shrink-0 min-w-[36px] text-center"
      :style="{ color: methodColor }"
    >{{ entry.method }}</span>
    <div class="flex-1 min-w-0">
      <div class="text-xs text-fc-text-secondary truncate">{{ truncateUrl(entry.url, 40) }}</div>
      <div class="flex items-center gap-2 mt-0.5">
        <span
          v-if="entry.status_code"
          class="text-[10px] font-mono font-semibold"
          :style="{ color: statusColor }"
        >{{ entry.status_code }}</span>
        <span class="text-[10px] text-fc-text-muted">{{ timeAgo(entry.created_at) }}</span>
      </div>
    </div>
  </div>
</template>
