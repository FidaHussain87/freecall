<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import { useCurl } from '@/composables/useCurl'
import { useUiStore } from '@/stores/ui'
import MethodSelector from './MethodSelector.vue'

const req = useRequestStore()
const ui = useUiStore()
const { parseCurl } = useCurl()

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text/plain') || ''
  const parsed = parseCurl(text)
  if (parsed) {
    e.preventDefault()
    req.method = parsed.method
    req.url = parsed.url
    req.headers = parsed.headers.length ? parsed.headers : [{ key: '', value: '', enabled: true }]
    req.bodyType = parsed.body_type
    req.bodyContent = parsed.body_content
    req.auth = parsed.auth
    ui.toast('Imported from cURL', 'success')
  }
}
</script>

<template>
  <div class="flex items-center gap-2 flex-1">
    <MethodSelector v-model="req.method" />
    <div class="flex-1 relative">
      <input
        data-url-input
        v-model="req.url"
        type="text"
        placeholder="Enter URL or paste cURL..."
        class="w-full px-3 py-2 text-sm font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted"
        @paste="onPaste"
        @keydown.enter.meta.prevent="req.sendRequest()"
        @keydown.enter.ctrl.prevent="req.sendRequest()"
      />
    </div>
    <button
      class="px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      :class="req.sending ? 'bg-fc-orange text-black' : 'bg-fc-accent text-white hover:bg-fc-accent-hover shadow-glow-sm'"
      :disabled="req.sending"
      @click="req.sendRequest()"
    >
      {{ req.sending ? 'Sending...' : 'Send' }}
    </button>
  </div>
</template>
