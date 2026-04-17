<script setup lang="ts">
import { computed } from 'vue'
import type { Collection } from '@/api/types'
import { useCollectionsStore } from '@/stores/collections'
import { useUiStore } from '@/stores/ui'
import * as api from '@/api/client'
import RequestItem from './RequestItem.vue'

const props = defineProps<{
  collection: Collection
  depth?: number
}>()

const collections = useCollectionsStore()
const ui = useUiStore()

const isExpanded = computed(() => collections.expandedIds.has(props.collection.id))

function toggle() {
  collections.toggleExpanded(props.collection.id)
}

function handleDelete() {
  ui.openModal('confirm', {
    title: 'Delete Collection',
    message: `Are you sure you want to delete "${props.collection.name}" and all its contents? This action cannot be undone.`,
    confirmLabel: 'Delete',
    danger: true,
    async onConfirm() {
      try {
        await collections.deleteCollection(props.collection.id)
        ui.toast('Collection deleted', 'info')
      } catch (e: any) {
        ui.toast(e.message || 'Delete failed', 'error')
      }
    },
  })
}

async function handleExport() {
  try {
    const blob = await api.exportCollection(props.collection.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.collection.name}.json`
    a.click()
    URL.revokeObjectURL(url)
    ui.toast('Exported', 'success')
  } catch (e: any) {
    ui.toast(e.message || 'Export failed', 'error')
  }
}
</script>

<template>
  <div :style="{ paddingLeft: (depth || 0) * 12 + 'px' }">
    <!-- Collection header -->
    <div
      class="group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-fc-bg-hover transition-colors"
      @click="toggle"
    >
      <svg
        class="w-3 h-3 text-fc-text-muted transition-transform shrink-0"
        :class="{ 'rotate-90': isExpanded }"
        viewBox="0 0 12 12"
        fill="currentColor"
      >
        <path d="M4 2l4 4-4 4z" />
      </svg>
      <svg class="w-4 h-4 text-fc-accent shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.24 3.24 0 011.166-.466l1.075-.107 2.335-2.335A1 1 0 017.283 4.75H16.25A1.75 1.75 0 0118 6.5v8.75A1.75 1.75 0 0116.25 17H3.75A1.75 1.75 0 012 15.25V8.001l.003-.076A1.75 1.75 0 013.75 6.25h.668L5.79 4.878A2.5 2.5 0 002 4.75v-1A1.75 1.75 0 013.75 3z" />
      </svg>
      <span class="text-sm text-fc-text-primary truncate flex-1">{{ collection.name }}</span>
      <div class="hidden group-hover:flex items-center gap-1" @click.stop>
        <button class="p-0.5 rounded text-fc-text-muted hover:text-fc-accent" title="Export" @click="handleExport">
          <svg class="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a.5.5 0 01.5.5v5.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L7.5 7.293V1.5A.5.5 0 018 1zM2 10a.5.5 0 01.5.5V13h11v-2.5a.5.5 0 011 0V13a1 1 0 01-1 1H2.5a1 1 0 01-1-1v-2.5A.5.5 0 012 10z" /></svg>
        </button>
        <button class="p-0.5 rounded text-fc-text-muted hover:text-fc-red" title="Delete" @click="handleDelete">
          <svg class="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" /><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
        </button>
      </div>
    </div>

    <!-- Expanded content -->
    <div v-if="isExpanded" class="ml-2">
      <!-- Requests -->
      <RequestItem
        v-for="req in collection.requests"
        :key="req.id"
        :request="req"
        :collection-id="collection.id"
      />
      <!-- Sub-collections -->
      <CollectionNode
        v-for="child in collection.children"
        :key="child.id"
        :collection="child"
        :depth="(depth || 0) + 1"
      />
      <div v-if="!collection.requests?.length && !collection.children?.length" class="px-6 py-2 text-xs text-fc-text-muted">
        Empty collection
      </div>
    </div>
  </div>
</template>
