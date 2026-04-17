<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { useRequestStore } from '@/stores/request'
import FcTabs from '@/components/common/FcTabs.vue'
import FcTabPanel from '@/components/common/FcTabPanel.vue'
import ResponseStatusBar from './ResponseStatusBar.vue'
import ResponseBody from './ResponseBody.vue'
import ResponseHeaders from './ResponseHeaders.vue'
import ResponseRaw from './ResponseRaw.vue'

const ui = useUiStore()
const req = useRequestStore()

const tabs = [
  { key: 'body', label: 'Body' },
  { key: 'headers', label: 'Headers' },
  { key: 'raw', label: 'Raw' },
]
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between border-b border-fc-border">
      <FcTabs :tabs="tabs" :model-value="ui.responseTab" @update:model-value="ui.responseTab = $event as any" />
      <ResponseStatusBar v-if="req.response" class="px-3" />
    </div>
    <div class="flex-1 overflow-auto min-h-0">
      <template v-if="req.sending">
        <div class="flex items-center justify-center h-full">
          <div class="flex flex-col items-center gap-3">
            <svg class="animate-spin h-8 w-8 text-fc-accent" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span class="text-sm text-fc-text-muted">Sending request...</span>
          </div>
        </div>
      </template>
      <template v-else-if="req.response">
        <FcTabPanel :active="ui.responseTab === 'body'"><ResponseBody /></FcTabPanel>
        <FcTabPanel :active="ui.responseTab === 'headers'"><ResponseHeaders /></FcTabPanel>
        <FcTabPanel :active="ui.responseTab === 'raw'"><ResponseRaw /></FcTabPanel>
      </template>
      <template v-else>
        <div class="flex items-center justify-center h-full text-fc-text-muted text-sm">
          Send a request to see the response
        </div>
      </template>
    </div>
  </div>
</template>
