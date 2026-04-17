<script setup lang="ts">
import { useRequestStore } from '@/stores/request'

const req = useRequestStore()
</script>

<template>
  <div class="space-y-3">
    <div>
      <label class="block text-xs text-fc-text-muted mb-1 font-medium">Username</label>
      <input
        :value="req.auth.basic_username || ''"
        type="text"
        placeholder="Username"
        class="w-full px-3 py-2 text-sm font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted"
        @input="req.auth = { ...req.auth, basic_username: ($event.target as HTMLInputElement).value }"
      />
    </div>
    <div>
      <label class="block text-xs text-fc-text-muted mb-1 font-medium">Password</label>
      <input
        :value="req.auth.basic_password || ''"
        type="password"
        placeholder="Password"
        class="w-full px-3 py-2 text-sm font-mono glass-input text-fc-text-primary placeholder:text-fc-text-muted"
        @input="req.auth = { ...req.auth, basic_password: ($event.target as HTMLInputElement).value }"
      />
    </div>
  </div>
</template>
