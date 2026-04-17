<script setup lang="ts">
import { onMounted } from 'vue'
import AppLayout from './components/layout/AppLayout.vue'
import FcToastContainer from './components/common/FcToastContainer.vue'
import { useTheme } from './composables/useTheme'
import { useKeyboard } from './composables/useKeyboard'
import { useCollectionsStore } from './stores/collections'
import { useHistoryStore } from './stores/history'
import { useEnvironmentStore } from './stores/environment'

const { initTheme } = useTheme()
useKeyboard()

onMounted(async () => {
  initTheme()
  const collections = useCollectionsStore()
  const history = useHistoryStore()
  const environments = useEnvironmentStore()
  await Promise.all([
    collections.loadCollections(),
    history.loadHistory(),
    environments.loadEnvironments(),
  ])
})
</script>

<template>
  <div id="modal-root"></div>
  <div id="dropdown-root"></div>
  <AppLayout />
  <FcToastContainer />
</template>
