<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections'
import { useUiStore } from '@/stores/ui'
import CollectionTree from './CollectionTree.vue'
import FcButton from '@/components/common/FcButton.vue'

const collections = useCollectionsStore()
const ui = useUiStore()
</script>

<template>
  <div class="p-3">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <button
          class="text-xs text-fc-text-muted hover:text-fc-accent transition-colors"
          @click="ui.openModal('new-collection')"
        >
          + New
        </button>
        <button
          class="text-xs text-fc-text-muted hover:text-fc-accent transition-colors"
          @click="ui.openModal('environment')"
        >
          Env
        </button>
        <button
          class="text-xs text-fc-text-muted hover:text-fc-accent transition-colors"
          @click="ui.openModal('import')"
        >
          Import
        </button>
      </div>
    </div>

    <div v-if="collections.loading" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-5 w-5 text-fc-text-muted" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>

    <div v-else-if="collections.collections.length === 0" class="text-center py-8">
      <p class="text-sm text-fc-text-muted mb-3">No collections yet</p>
      <FcButton size="sm" @click="ui.openModal('new-collection')">Create Collection</FcButton>
    </div>

    <CollectionTree v-else :collections="collections.collections" />
  </div>
</template>
