<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import FcKeyValueEditor from '@/components/common/FcKeyValueEditor.vue'

const req = useRequestStore()
</script>

<template>
  <FcKeyValueEditor
    :model-value="req.headers"
    key-placeholder="Header name"
    value-placeholder="Header value"
    @update:model-value="req.headers = $event"
  />
</template>
