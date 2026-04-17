import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Environment } from '@/api/types'
import * as api from '@/api/client'

export const useEnvironmentStore = defineStore('environment', () => {
  const environments = ref<Environment[]>([])
  const loading = ref(false)

  const activeEnvironment = computed(() => environments.value.find(e => e.is_active) ?? null)

  async function loadEnvironments() {
    loading.value = true
    try {
      environments.value = await api.getEnvironments()
    } catch { /* silent */ } finally {
      loading.value = false
    }
  }

  async function createEnvironment(name: string) {
    const env = await api.createEnvironment({ name })
    await loadEnvironments()
    return env
  }

  async function deleteEnvironment(id: number) {
    await api.deleteEnvironment(id)
    await loadEnvironments()
  }

  async function activateEnvironment(id: number) {
    await api.activateEnvironment(id)
    await loadEnvironments()
  }

  async function setVariables(envId: number, variables: { key: string; value: string; is_secret?: boolean }[]) {
    await api.setVariables(envId, variables)
    await loadEnvironments()
  }

  return {
    environments, loading, activeEnvironment,
    loadEnvironments, createEnvironment, deleteEnvironment,
    activateEnvironment, setVariables,
  }
})
