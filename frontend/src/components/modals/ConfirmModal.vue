<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import FcModal from '@/components/common/FcModal.vue'
import FcButton from '@/components/common/FcButton.vue'

const emit = defineEmits<{ close: [] }>()
const ui = useUiStore()

function confirm() {
  ui.modalProps.onConfirm?.()
  emit('close')
}
</script>

<template>
  <FcModal :title="ui.modalProps.title || 'Confirm'" @close="$emit('close')">
    <p class="text-sm text-fc-text-secondary">{{ ui.modalProps.message || 'Are you sure?' }}</p>
    <template #footer>
      <FcButton variant="secondary" @click="$emit('close')">Cancel</FcButton>
      <FcButton :variant="ui.modalProps.danger ? 'danger' : 'primary'" @click="confirm">
        {{ ui.modalProps.confirmLabel || 'Confirm' }}
      </FcButton>
    </template>
  </FcModal>
</template>
