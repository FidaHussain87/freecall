<script setup lang="ts">
import { useGsap } from '@/composables/useGsap'

defineProps<{
  title: string
  width?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { scaleIn, scaleOut } = useGsap()

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      @enter="(el, done) => scaleIn(el, done)"
      @leave="(el, done) => scaleOut(el, done)"
    >
      <div
        class="modal-overlay fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @mousedown="onOverlayClick"
      >
        <div
          class="glass-panel-strong w-full overflow-hidden shadow-2xl"
          :style="{ maxWidth: width || '480px' }"
        >
          <div class="flex items-center justify-between px-5 py-4 border-b border-fc-border">
            <h2 class="text-lg font-semibold text-fc-text-primary">{{ title }}</h2>
            <button
              class="p-1 rounded-md text-fc-text-muted hover:text-fc-text-primary hover:bg-fc-bg-hover transition-colors"
              @click="$emit('close')"
            >
              <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
          <div class="p-5">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-5 py-3 border-t border-fc-border flex justify-end gap-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
