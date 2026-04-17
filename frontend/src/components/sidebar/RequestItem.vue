<script setup lang="ts">
import { computed } from 'vue'
import type { SavedRequest } from '@/api/types'
import { useRequestStore } from '@/stores/request'
import { useCollectionsStore } from '@/stores/collections'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{
  request: SavedRequest
  collectionId: number
}>()

const reqStore = useRequestStore()
const collections = useCollectionsStore()
const ui = useUiStore()

const isActive = computed(() => reqStore.activeRequestId === props.request.id)

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
  return map[props.request.method] || 'var(--fc-text-muted)'
})

function load() {
  reqStore.loadFromSaved(props.collectionId, props.request)
}

function handleDelete() {
  ui.openModal('confirm', {
    title: 'Delete Request',
    message: `Are you sure you want to delete "${props.request.name || props.request.url}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    danger: true,
    async onConfirm() {
      try {
        await collections.deleteSavedRequest(props.collectionId, props.request.id)
        ui.toast('Request deleted', 'info')
      } catch (e: any) {
        ui.toast(e.message || 'Delete failed', 'error')
      }
    },
  })
}
</script>

<template>
  <div
    class="group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors"
    :class="isActive ? 'bg-fc-accent-dim' : 'hover:bg-fc-bg-hover'"
    @click="load"
  >
    <span
      class="text-[10px] font-mono font-bold uppercase shrink-0 min-w-[36px] text-center"
      :style="{ color: methodColor }"
    >{{ request.method }}</span>
    <span class="text-xs text-fc-text-secondary truncate flex-1">{{ request.name || request.url }}</span>
    <button
      class="hidden group-hover:block p-0.5 rounded text-fc-text-muted hover:text-fc-red shrink-0"
      @click.stop="handleDelete"
    >
      <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
    </button>
  </div>
</template>
