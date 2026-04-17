<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import FcDropdown from '@/components/common/FcDropdown.vue'
import type { DropdownOption } from '@/components/common/FcDropdown.vue'
import AuthNone from './auth/AuthNone.vue'
import AuthBearer from './auth/AuthBearer.vue'
import AuthBasic from './auth/AuthBasic.vue'
import AuthApiKey from './auth/AuthApiKey.vue'

const req = useRequestStore()

const authOptions: DropdownOption[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'api_key', label: 'API Key' },
]

function onAuthTypeChange(val: string) {
  req.auth = { ...req.auth, type: val as any }
}
</script>

<template>
  <div class="space-y-3">
    <FcDropdown
      :model-value="req.auth.type"
      :options="authOptions"
      @update:model-value="onAuthTypeChange"
    />
    <AuthNone v-if="req.auth.type === 'none'" />
    <AuthBearer v-else-if="req.auth.type === 'bearer'" />
    <AuthBasic v-else-if="req.auth.type === 'basic'" />
    <AuthApiKey v-else-if="req.auth.type === 'api_key'" />
  </div>
</template>
