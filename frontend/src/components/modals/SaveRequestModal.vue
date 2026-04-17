<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRequestStore } from '@/stores/request'
import { useCollectionsStore } from '@/stores/collections'
import { useUiStore } from '@/stores/ui'
import FcModal from '@/components/common/FcModal.vue'
import FcButton from '@/components/common/FcButton.vue'
import FcDropdown from '@/components/common/FcDropdown.vue'
import type { DropdownOption } from '@/components/common/FcDropdown.vue'

const emit = defineEmits<{ close: [] }>()

const req = useRequestStore()
const collections = useCollectionsStore()
const ui = useUiStore()

const name = ref(req.url || 'New Request')
const selectedCollectionId = ref<string>(
  req.activeCollectionId?.toString() || collections.collections[0]?.id?.toString() || ''
)
const saving = ref(false)

const collectionOptions = computed<DropdownOption[]>(() => {
  const opts: DropdownOption[] = []
  function flatten(colls: any[], prefix = '') {
    for (const c of colls) {
      opts.push({ value: c.id.toString(), label: prefix + c.name })
      if (c.children?.length) flatten(c.children, prefix + '  ')
    }
  }
  flatten(collections.collections)
  return opts
})

async function save() {
  if (!name.value.trim() || !selectedCollectionId.value) {
    ui.toast('Name and collection are required', 'error')
    return
  }
  saving.value = true
  try {
    const data: Record<string, any> = {
      name: name.value.trim(),
      method: req.method,
      url: req.url,
      headers: req.headers.filter(h => h.key),
      query_params: req.queryParams.filter(p => p.key),
      body_type: req.bodyType,
      body_content: req.bodyContent || null,
      auth_type: req.auth.type,
      auth_data: req.auth,
    }
    const collId = parseInt(selectedCollectionId.value)

    if (req.activeRequestId && req.activeCollectionId === collId) {
      await collections.updateSavedRequest(collId, req.activeRequestId, data)
      ui.toast('Request updated', 'success')
    } else {
      const saved = await collections.createSavedRequest(collId, data)
      req.activeCollectionId = collId
      req.activeRequestId = saved.id
      ui.toast('Request saved', 'success')
    }
    emit('close')
  } catch (e: any) {
    ui.toast(e.message || 'Save failed', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <FcModal title="Save Request" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-xs text-fc-text-muted mb-1 font-medium">Name</label>
        <input
          v-model="name"
          type="text"
          class="w-full px-3 py-2 text-sm glass-input text-fc-text-primary"
          placeholder="Request name"
          @keydown.enter="save"
        />
      </div>
      <div>
        <label class="block text-xs text-fc-text-muted mb-1 font-medium">Collection</label>
        <FcDropdown
          :model-value="selectedCollectionId"
          :options="collectionOptions"
          searchable
          @update:model-value="selectedCollectionId = $event"
        />
      </div>
    </div>
    <template #footer>
      <FcButton variant="secondary" @click="$emit('close')">Cancel</FcButton>
      <FcButton :loading="saving" @click="save">Save</FcButton>
    </template>
  </FcModal>
</template>
