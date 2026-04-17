<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import { useFormatters } from '@/composables/useFormatters'

const req = useRequestStore()
const { formatBytes } = useFormatters()

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  req.binaryFile = files?.[0] || null
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-8 border-2 border-dashed border-fc-border rounded-lg hover:border-fc-accent/40 transition-colors cursor-pointer"
    @click="($refs.fileInput as HTMLInputElement)?.click()"
  >
    <svg class="w-8 h-8 text-fc-text-muted mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 16V4m0 0L8 8m4-4l4 4M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
    </svg>
    <span v-if="!req.binaryFile" class="text-sm text-fc-text-muted">Click to select a file</span>
    <template v-else>
      <span class="text-sm text-fc-text-primary">{{ req.binaryFile.name }}</span>
      <span class="text-xs text-fc-text-muted mt-1">{{ formatBytes(req.binaryFile.size) }}</span>
      <button
        class="mt-2 text-xs text-fc-red hover:underline"
        @click.stop="req.binaryFile = null"
      >
        Remove
      </button>
    </template>
    <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
  </div>
</template>
