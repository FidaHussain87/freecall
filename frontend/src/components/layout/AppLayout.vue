<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import AppSidebar from './AppSidebar.vue'
import AppMainPane from './AppMainPane.vue'
import SaveRequestModal from '@/components/modals/SaveRequestModal.vue'
import NewCollectionModal from '@/components/modals/NewCollectionModal.vue'
import EnvironmentModal from '@/components/modals/EnvironmentModal.vue'
import ImportModal from '@/components/modals/ImportModal.vue'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'

const ui = useUiStore()
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-fc-bg-primary">
    <!-- Mobile overlay -->
    <div
      v-if="ui.sidebarOpen"
      class="fixed inset-0 bg-black/40 z-30 lg:hidden"
      @click="ui.toggleSidebar()"
    />

    <!-- Sidebar wrapper: on desktop (lg+) it's in-flow and animates width;
         on mobile (<lg) it's fixed/overlay so it doesn't push the main content -->
    <!-- Desktop sidebar (in-flow) -->
    <div
      class="hidden lg:block shrink-0 z-40 h-full transition-[width] duration-300 ease-in-out overflow-hidden relative"
      :class="ui.sidebarOpen ? 'w-[280px]' : 'w-0'"
    >
      <AppSidebar class="w-[280px] h-full" />
    </div>
    <!-- Mobile sidebar (fixed overlay) -->
    <div
      class="lg:hidden fixed inset-y-0 left-0 z-40 w-[280px] transition-transform duration-300 ease-in-out"
      :class="ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <AppSidebar class="w-[280px] h-full" />
    </div>

    <!-- Main -->
    <div class="flex-1 min-w-0 flex flex-col h-full relative">
      <!-- Toggle button: inside the main pane, top-left corner when collapsed -->
      <button
        v-if="!ui.sidebarOpen"
        class="absolute top-3 left-3 z-50 group"
        @click="ui.toggleSidebar()"
        title="Open sidebar"
      >
        <div class="w-8 h-8 flex items-center justify-center rounded-lg text-fc-text-muted hover:text-fc-text-primary hover:bg-fc-bg-hover transition-all duration-200">
          <!-- Sidebar open icon: panel with right arrow -->
          <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
            <path d="M14 10l3 2-3 2" />
          </svg>
        </div>
      </button>

      <AppMainPane :class="[!ui.sidebarOpen ? 'pl-0' : '', !ui.sidebarOpen ? '' : 'lg:pl-0']" />
    </div>

    <!-- Modals -->
    <SaveRequestModal v-if="ui.activeModal === 'save-request'" @close="ui.closeModal()" />
    <NewCollectionModal v-if="ui.activeModal === 'new-collection'" @close="ui.closeModal()" />
    <EnvironmentModal v-if="ui.activeModal === 'environment'" @close="ui.closeModal()" />
    <ImportModal v-if="ui.activeModal === 'import'" @close="ui.closeModal()" />
    <ConfirmModal v-if="ui.activeModal === 'confirm'" @close="ui.closeModal()" />
  </div>
</template>
