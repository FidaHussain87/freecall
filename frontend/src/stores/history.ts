import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { HistoryEntry } from '@/api/types'
import * as api from '@/api/client'

export const useHistoryStore = defineStore('history', () => {
  const items = ref<HistoryEntry[]>([])
  const loading = ref(false)

  async function loadHistory() {
    loading.value = true
    try {
      items.value = await api.getHistory()
    } catch { /* silent */ } finally {
      loading.value = false
    }
  }

  async function clearHistory() {
    await api.clearHistory()
    items.value = []
  }

  return { items, loading, loadHistory, clearHistory }
})
