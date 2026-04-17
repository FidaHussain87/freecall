<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import FcKeyValueEditor from '@/components/common/FcKeyValueEditor.vue'

const req = useRequestStore()
</script>

<template>
  <FcKeyValueEditor
    :model-value="req.queryParams"
    key-placeholder="Parameter"
    value-placeholder="Value"
    @update:model-value="req.queryParams = $event"
  />
</template>
