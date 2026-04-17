<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import CodeEditor from '@/components/editor/CodeEditor.vue'

const req = useRequestStore()
</script>

<template>
  <div class="space-y-3">
    <div>
      <label class="block text-xs text-fc-text-muted mb-1 font-medium">Query</label>
      <CodeEditor
        :model-value="req.bodyContent"
        language="graphql"
        placeholder="query { }"
        min-height="100px"
        @update:model-value="req.bodyContent = $event"
      />
    </div>
    <div>
      <label class="block text-xs text-fc-text-muted mb-1 font-medium">Variables (JSON)</label>
      <CodeEditor
        :model-value="req.graphqlVariables"
        language="json"
        placeholder='{ "key": "value" }'
        min-height="60px"
        :auto-format="true"
        @update:model-value="req.graphqlVariables = $event"
      />
    </div>
  </div>
</template>
