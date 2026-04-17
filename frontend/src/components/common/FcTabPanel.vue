<script setup lang="ts">
defineProps<{
  active: boolean
}>()
</script>

<template>
  <div v-show="active" class="flex-1 overflow-auto">
    <slot />
  </div>
</template>
