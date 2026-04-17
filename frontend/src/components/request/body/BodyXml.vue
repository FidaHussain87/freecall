<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import CodeEditor from '@/components/editor/CodeEditor.vue'

const req = useRequestStore()
</script>

<template>
  <CodeEditor
    :model-value="req.bodyContent"
    language="xml"
    placeholder='<root>&#10;  <element>value</element>&#10;</root>'
    @update:model-value="req.bodyContent = $event"
  />
</template>
