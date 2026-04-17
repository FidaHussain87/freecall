<script setup lang="ts">
import { ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useResize } from '@/composables/useResize'
import UrlBar from '@/components/url-bar/UrlBar.vue'
import RequestPanel from '@/components/request/RequestPanel.vue'
import ResponsePanel from '@/components/response/ResponsePanel.vue'
import PaneResizer from './PaneResizer.vue'

const ui = useUiStore()
const containerRef = ref<HTMLElement | null>(null)
const { ratio, onPointerDown } = useResize(containerRef)
</script>

<template>
  <main class="flex flex-col h-full overflow-hidden">
    <!-- Top bar with URL -->
    <div
      class="flex items-center gap-2 px-4 py-3 border-b border-fc-border shrink-0 transition-[padding] duration-300"
      :class="ui.sidebarOpen ? '' : 'pl-14'"
    >
      <UrlBar class="flex-1" />
    </div>

    <!-- Request/Response split -->
    <div ref="containerRef" class="flex-1 flex flex-col overflow-hidden min-h-0">
      <div :style="{ height: (ratio * 100) + '%' }" class="overflow-hidden flex flex-col min-h-0">
        <RequestPanel />
      </div>
      <PaneResizer @pointerdown="onPointerDown" />
      <div :style="{ height: ((1 - ratio) * 100) + '%' }" class="overflow-hidden flex flex-col min-h-0">
        <ResponsePanel />
      </div>
    </div>
  </main>
</template>
