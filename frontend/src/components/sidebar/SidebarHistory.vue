<script setup lang="ts">
import { useHistoryStore } from '@/stores/history'
import { useUiStore } from '@/stores/ui'
import HistoryItem from './HistoryItem.vue'

const history = useHistoryStore()
const ui = useUiStore()

async function handleClear() {
  await history.clearHistory()
  ui.toast('History cleared', 'info')
}
</script>

<template>
  <div class="p-3">
    <div class="flex items-center justify-between mb-3">
      <button
        v-if="history.items.length"
        class="text-xs text-fc-text-muted hover:text-fc-red transition-colors"
        @click="handleClear"
      >
        Clear all
      </button>
    </div>

    <div v-if="history.loading" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-5 w-5 text-fc-text-muted" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>

    <div v-else-if="history.items.length === 0" class="text-center py-8">
      <p class="text-sm text-fc-text-muted">No history yet</p>
    </div>

    <div v-else class="space-y-1">
      <HistoryItem
        v-for="item in history.items"
        :key="item.id"
        :entry="item"
      />
    </div>
  </div>
</template>
