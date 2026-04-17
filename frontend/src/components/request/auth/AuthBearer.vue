<script setup lang="ts">
import { useRequestStore } from '@/stores/request'

const req = useRequestStore()
</script>

<template>
  <div class="space-y-3">
    <div>
      <label class="block text-xs text-fc-text-muted mb-1 font-medium">Token</label>
      <input
        :value="req.auth.bearer_token || ''"
        type="text"
        placeholder="Enter bearer token"
        class="w-full px-3 py-2 text-sm font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted"
        @input="req.auth = { ...req.auth, bearer_token: ($event.target as HTMLInputElement).value }"
      />
    </div>
  </div>
</template>
