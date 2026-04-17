<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useRequestStore } from '@/stores/request'
import FcTabs from '@/components/common/FcTabs.vue'
import FcTabPanel from '@/components/common/FcTabPanel.vue'
import ParamsTab from './ParamsTab.vue'
import HeadersTab from './HeadersTab.vue'
import BodyTab from './BodyTab.vue'
import AuthTab from './AuthTab.vue'

const ui = useUiStore()
const req = useRequestStore()

const tabs = computed(() => [
  { key: 'params', label: 'Params', count: req.queryParams.filter(p => p.key).length },
  { key: 'headers', label: 'Headers', count: req.headers.filter(h => h.key).length },
  { key: 'body', label: 'Body' },
  { key: 'auth', label: 'Auth' },
])
</script>

<template>
  <div class="flex flex-col h-full">
    <FcTabs :tabs="tabs" :model-value="ui.requestTab" @update:model-value="ui.requestTab = $event as any" />
    <div class="flex-1 overflow-auto p-3 min-h-0">
      <FcTabPanel :active="ui.requestTab === 'params'"><ParamsTab /></FcTabPanel>
      <FcTabPanel :active="ui.requestTab === 'headers'"><HeadersTab /></FcTabPanel>
      <FcTabPanel :active="ui.requestTab === 'body'"><BodyTab /></FcTabPanel>
      <FcTabPanel :active="ui.requestTab === 'auth'"><AuthTab /></FcTabPanel>
    </div>
  </div>
</template>
