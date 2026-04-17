<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import FcDropdown from '@/components/common/FcDropdown.vue'
import type { DropdownOption } from '@/components/common/FcDropdown.vue'
import BodyNone from './body/BodyNone.vue'
import BodyJson from './body/BodyJson.vue'
import BodyFormUrlEncoded from './body/BodyFormUrlEncoded.vue'
import BodyMultipart from './body/BodyMultipart.vue'
import BodyXml from './body/BodyXml.vue'
import BodyGraphql from './body/BodyGraphql.vue'
import BodyRaw from './body/BodyRaw.vue'
import BodyBinary from './body/BodyBinary.vue'

const req = useRequestStore()

const bodyTypeOptions: DropdownOption[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'form_urlencoded', label: 'Form URL-Encoded' },
  { value: 'multipart', label: 'Multipart Form' },
  { value: 'xml', label: 'XML' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'raw', label: 'Raw' },
  { value: 'binary', label: 'Binary' },
]
</script>

<template>
  <div class="space-y-3">
    <FcDropdown
      :model-value="req.bodyType"
      :options="bodyTypeOptions"
      @update:model-value="req.bodyType = $event as any"
    />
    <BodyNone v-if="req.bodyType === 'none'" />
    <BodyJson v-else-if="req.bodyType === 'json'" />
    <BodyFormUrlEncoded v-else-if="req.bodyType === 'form_urlencoded' || req.bodyType === 'form'" />
    <BodyMultipart v-else-if="req.bodyType === 'multipart'" />
    <BodyXml v-else-if="req.bodyType === 'xml'" />
    <BodyGraphql v-else-if="req.bodyType === 'graphql'" />
    <BodyRaw v-else-if="req.bodyType === 'raw'" />
    <BodyBinary v-else-if="req.bodyType === 'binary'" />
  </div>
</template>
