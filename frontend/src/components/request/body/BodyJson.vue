<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import { useFormatters } from '@/composables/useFormatters'
import { useUiStore } from '@/stores/ui'
import CodeEditor from '@/components/editor/CodeEditor.vue'

const req = useRequestStore()
const { prettifyJson, isValidJson, isFixableJson, fixJson } = useFormatters()
const ui = useUiStore()

function formatBody() {
  const content = req.bodyContent.trim()
  if (!content) return

  if (isValidJson(content)) {
    req.bodyContent = prettifyJson(content)
    ui.toast('JSON formatted', 'success')
  } else if (isFixableJson(content)) {
    // Fix common errors (missing commas, etc.) then format
    const fixed = fixJson(content)
    req.bodyContent = prettifyJson(fixed)
    ui.toast('JSON fixed & formatted', 'success')
  } else {
    ui.toast('Invalid JSON — could not auto-fix', 'error')
  }
}
</script>

<template>
  <div>
    <div class="flex justify-end mb-2">
      <button
        class="text-xs text-fc-text-muted hover:text-fc-accent transition-colors px-2 py-1"
        @click="formatBody"
      >
        Format JSON
      </button>
    </div>
    <CodeEditor
      :model-value="req.bodyContent"
      language="json"
      placeholder='{ "key": "value" }'
      :auto-format="true"
      @update:model-value="req.bodyContent = $event"
    />
  </div>
</template>
