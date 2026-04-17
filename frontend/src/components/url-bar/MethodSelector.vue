<script setup lang="ts">
import FcDropdown from '@/components/common/FcDropdown.vue'
import type { DropdownOption } from '@/components/common/FcDropdown.vue'
import type { HttpMethod } from '@/api/types'

defineProps<{
  modelValue: HttpMethod
}>()

const emit = defineEmits<{
  'update:modelValue': [value: HttpMethod]
}>()

const methodOptions: DropdownOption[] = [
  { value: 'GET', label: 'GET', color: 'var(--fc-method-get)' },
  { value: 'POST', label: 'POST', color: 'var(--fc-method-post)' },
  { value: 'PUT', label: 'PUT', color: 'var(--fc-method-put)' },
  { value: 'PATCH', label: 'PATCH', color: 'var(--fc-method-patch)' },
  { value: 'DELETE', label: 'DELETE', color: 'var(--fc-method-delete)' },
  { value: 'HEAD', label: 'HEAD', color: 'var(--fc-method-head)' },
  { value: 'OPTIONS', label: 'OPTIONS', color: 'var(--fc-method-options)' },
]
</script>

<template>
  <FcDropdown
    :model-value="modelValue"
    :options="methodOptions"
    variant="method"
    @update:model-value="emit('update:modelValue', $event as HttpMethod)"
  />
</template>
