<script setup lang="ts">
import { ref } from 'vue'
import { useCollectionsStore } from '@/stores/collections'
import { useUiStore } from '@/stores/ui'
import FcModal from '@/components/common/FcModal.vue'
import FcButton from '@/components/common/FcButton.vue'

const emit = defineEmits<{ close: [] }>()

const collections = useCollectionsStore()
const ui = useUiStore()

const name = ref('')
const saving = ref(false)

async function create() {
  if (!name.value.trim()) {
    ui.toast('Collection name is required', 'error')
    return
  }
  saving.value = true
  try {
    await collections.createCollection(name.value.trim())
    ui.toast('Collection created', 'success')
    emit('close')
  } catch (e: any) {
    ui.toast(e.message || 'Create failed', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <FcModal title="New Collection" @close="$emit('close')">
    <div>
      <label class="block text-xs text-fc-text-muted mb-1 font-medium">Name</label>
      <input
        v-model="name"
        type="text"
        class="w-full px-3 py-2 text-sm glass-input text-fc-text-primary"
        placeholder="Collection name"
        autofocus
        @keydown.enter="create"
      />
    </div>
    <template #footer>
      <FcButton variant="secondary" @click="$emit('close')">Cancel</FcButton>
      <FcButton :loading="saving" @click="create">Create</FcButton>
    </template>
  </FcModal>
</template>
