<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import FcTabs from '@/components/common/FcTabs.vue'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher.vue'
import SidebarCollections from '@/components/sidebar/SidebarCollections.vue'
import SidebarHistory from '@/components/sidebar/SidebarHistory.vue'

const ui = useUiStore()

const sidebarTabs = [
  { key: 'collections', label: 'Collections' },
  { key: 'history', label: 'History' },
]
</script>

<template>
  <aside class="h-full flex flex-col glass-panel-strong border-r border-fc-border overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-fc-border">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-lg font-bold text-fc-accent neon-text tracking-wide">Free Call</h1>
        <!-- Collapse toggle inside sidebar -->
        <button
          class="group w-8 h-8 flex items-center justify-center rounded-lg text-fc-text-muted hover:text-fc-text-primary hover:bg-fc-bg-hover transition-all duration-200"
          title="Close sidebar"
          @click="ui.toggleSidebar()"
        >
          <!-- Panel icon with left arrow (collapse) -->
          <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
            <path d="M16 10l-3 2 3 2" />
          </svg>
        </button>
      </div>
      <ThemeSwitcher />
    </div>

    <!-- Tabs -->
    <FcTabs
      :tabs="sidebarTabs"
      :model-value="ui.sidebarTab"
      @update:model-value="ui.sidebarTab = $event as any"
    />

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <SidebarCollections v-if="ui.sidebarTab === 'collections'" />
      <SidebarHistory v-else />
    </div>
  </aside>
</template>
