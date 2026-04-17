<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import FcToast from './FcToast.vue'

const ui = useUiStore()
</script>

<template>
  <div class="fixed top-4 right-4 z-[300] flex flex-col gap-2">
    <TransitionGroup name="toast">
      <FcToast
        v-for="toast in ui.toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { transform: translateX(100%); opacity: 0; }
.toast-leave-to { transform: translateX(100%); opacity: 0; }
</style>
