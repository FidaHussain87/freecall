<script setup lang="ts">
import { ref } from 'vue'
import { useCollectionsStore } from '@/stores/collections'
import { useUiStore } from '@/stores/ui'
import * as api from '@/api/client'
import FcModal from '@/components/common/FcModal.vue'
import FcButton from '@/components/common/FcButton.vue'

const emit = defineEmits<{ close: [] }>()

const collections = useCollectionsStore()
const ui = useUiStore()

const file = ref<File | null>(null)
const importing = ref(false)

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  file.value = files?.[0] || null
}

async function doImport() {
  if (!file.value) {
    ui.toast('Select a file first', 'error')
    return
  }
  importing.value = true
  try {
    const result = await api.importCollections(file.value)
    await collections.loadCollections()
    ui.toast(result.message || `Imported ${result.imported} collection(s)`, 'success')
    emit('close')
  } catch (e: any) {
    ui.toast(e?.response?.data?.detail || e.message || 'Import failed', 'error')
  } finally {
    importing.value = false
  }
}

async function exportAll() {
  try {
    const blob = await api.exportAllCollections()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'free-call-collections.json'
    a.click()
    URL.revokeObjectURL(url)
    ui.toast('All collections exported', 'success')
  } catch (e: any) {
    ui.toast(e.message || 'Export failed', 'error')
  }
}
</script>

<template>
  <FcModal title="Import / Export" @close="$emit('close')">
    <div class="space-y-5">
      <div>
        <label class="block text-xs text-fc-text-muted mb-2 font-medium">Import Collections</label>
        <div class="flex items-center gap-3">
          <label class="px-3 py-1.5 text-sm glass-input text-fc-text-secondary hover:bg-fc-bg-hover transition-colors cursor-pointer">
            Choose JSON file
            <input type="file" accept=".json" class="hidden" @change="onFileChange" />
          </label>
          <span v-if="file" class="text-xs text-fc-text-secondary truncate">{{ file.name }}</span>
        </div>
      </div>
      <div class="border-t border-fc-border pt-4">
        <label class="block text-xs text-fc-text-muted mb-2 font-medium">Export All Collections</label>
        <FcButton variant="secondary" size="sm" @click="exportAll">Download All</FcButton>
      </div>
    </div>
    <template #footer>
      <FcButton variant="secondary" @click="$emit('close')">Cancel</FcButton>
      <FcButton :loading="importing" :disabled="!file" @click="doImport">Import</FcButton>
    </template>
  </FcModal>
</template>
