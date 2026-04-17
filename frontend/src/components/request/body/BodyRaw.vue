<script setup lang="ts">
import { computed } from 'vue'
import { useRequestStore } from '@/stores/request'
import FcDropdown from '@/components/common/FcDropdown.vue'
import type { DropdownOption } from '@/components/common/FcDropdown.vue'
import CodeEditor from '@/components/editor/CodeEditor.vue'

const req = useRequestStore()

const subTypeOptions: DropdownOption[] = [
  { value: 'text', label: 'Text' },
  { value: 'html', label: 'HTML' },
  { value: 'xml', label: 'XML' },
  { value: 'javascript', label: 'JavaScript' },
]

const editorLang = computed(() => {
  switch (req.bodyRawSubType) {
    case 'html': return 'html'
    case 'xml': return 'xml'
    case 'javascript': return 'javascript'
    default: return 'text'
  }
})
</script>

<template>
  <div class="space-y-2">
    <div class="w-40">
      <FcDropdown
        :model-value="req.bodyRawSubType"
        :options="subTypeOptions"
        @update:model-value="req.bodyRawSubType = $event as any"
      />
    </div>
    <CodeEditor
      :model-value="req.bodyContent"
      :language="editorLang"
      placeholder="Enter raw body..."
      @update:model-value="req.bodyContent = $event"
    />
  </div>
</template>
