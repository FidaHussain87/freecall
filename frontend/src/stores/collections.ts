import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Collection } from '@/api/types'
import * as api from '@/api/client'

export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref<Collection[]>([])
  const expandedIds = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem('fc_expanded_collections') || '[]')))
  const loading = ref(false)

  async function loadCollections() {
    loading.value = true
    try {
      collections.value = await api.getCollections()
    } catch { /* silent */ } finally {
      loading.value = false
    }
  }

  async function createCollection(name: string, parentId?: number | null) {
    const coll = await api.createCollection({ name, parent_id: parentId ?? null })
    await loadCollections()
    return coll
  }

  async function deleteCollection(id: number) {
    await api.deleteCollection(id)
    expandedIds.value.delete(id)
    persistExpanded()
    await loadCollections()
  }

  async function createSavedRequest(collId: number, data: Record<string, any>) {
    const req = await api.createSavedRequest(collId, data)
    await loadCollections()
    return req
  }

  async function updateSavedRequest(collId: number, reqId: number, data: Record<string, any>) {
    const req = await api.updateSavedRequest(collId, reqId, data)
    await loadCollections()
    return req
  }

  async function deleteSavedRequest(collId: number, reqId: number) {
    await api.deleteSavedRequest(collId, reqId)
    await loadCollections()
  }

  function toggleExpanded(id: number) {
    if (expandedIds.value.has(id)) {
      expandedIds.value.delete(id)
    } else {
      expandedIds.value.add(id)
    }
    persistExpanded()
  }

  function persistExpanded() {
    localStorage.setItem('fc_expanded_collections', JSON.stringify([...expandedIds.value]))
  }

  return {
    collections, expandedIds, loading,
    loadCollections, createCollection, deleteCollection,
    createSavedRequest, updateSavedRequest, deleteSavedRequest,
    toggleExpanded,
  }
})
