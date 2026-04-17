<script setup lang="ts">
import type { Collection } from '@/api/types'
import CollectionNode from './CollectionNode.vue'

defineProps<{
  collections: Collection[]
}>()
</script>

<template>
  <div class="space-y-0.5">
    <CollectionNode
      v-for="collection in collections"
      :key="collection.id"
      :collection="collection"
    />
  </div>
</template>
