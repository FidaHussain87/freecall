<script setup lang="ts">
import { computed } from 'vue'
import { useRequestStore } from '@/stores/request'
import { useFormatters } from '@/composables/useFormatters'
import { useUiStore } from '@/stores/ui'
import CodeEditor from '@/components/editor/CodeEditor.vue'

const req = useRequestStore()
const { prettifyJson, copyToClipboard } = useFormatters()
const ui = useUiStore()

const displayBody = computed(() => {
  if (!req.response?.body) return ''
  if (req.response.is_json) {
    return prettifyJson(req.response.body)
  }
  return req.response.body
})

const language = computed(() => {
  if (req.response?.is_json) return 'json' as const
  const ct = Object.entries(req.response?.response_headers || {})
    .find(([k]) => k.toLowerCase() === 'content-type')?.[1] || ''
  if (ct.includes('xml')) return 'xml' as const
  if (ct.includes('html')) return 'html' as const
  if (ct.includes('javascript')) return 'javascript' as const
  return 'text' as const
})

function copy() {
  copyToClipboard(
    displayBody.value,
    () => ui.toast('Copied response body', 'success'),
    () => ui.toast('Copy failed', 'error'),
  )
}
</script>

<template>
  <div class="p-3 h-full flex flex-col">
    <div v-if="req.response?.error && !req.response.status_code" class="p-4 rounded-lg bg-fc-red/10 border border-fc-red/20">
      <p class="text-sm text-fc-red">{{ req.response.error }}</p>
    </div>
    <template v-else-if="displayBody">
      <div class="flex justify-end mb-2">
        <button
          class="text-xs text-fc-text-muted hover:text-fc-accent transition-colors px-2 py-1"
          @click="copy"
        >
          Copy
        </button>
      </div>
      <div class="flex-1 min-h-0">
        <CodeEditor
          :model-value="displayBody"
          :language="language"
          :readonly="true"
          min-height="80px"
        />
      </div>
    </template>
    <div v-else class="flex items-center justify-center h-full text-fc-text-muted text-sm">
      No response body
    </div>
  </div>
</template>
