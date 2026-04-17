<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useEnvironmentStore } from '@/stores/environment'
import { useUiStore } from '@/stores/ui'
import FcModal from '@/components/common/FcModal.vue'
import FcButton from '@/components/common/FcButton.vue'
import FcDropdown from '@/components/common/FcDropdown.vue'
import type { DropdownOption } from '@/components/common/FcDropdown.vue'

const emit = defineEmits<{ close: [] }>()

const envStore = useEnvironmentStore()
const ui = useUiStore()

const selectedEnvId = ref<string>(envStore.activeEnvironment?.id?.toString() || '')
const newEnvName = ref('')
const variables = ref<{ key: string; value: string; is_secret: boolean }[]>([])
const saving = ref(false)

const envOptions = computed<DropdownOption[]>(() => {
  return [
    { value: '', label: 'No Environment' },
    ...envStore.environments.map(e => ({
      value: e.id.toString(),
      label: e.name + (e.is_active ? ' (active)' : ''),
    })),
  ]
})

watch(selectedEnvId, (id) => {
  if (!id) {
    variables.value = []
    return
  }
  const env = envStore.environments.find(e => e.id === parseInt(id))
  if (env) {
    variables.value = env.variables.map(v => ({ key: v.key, value: v.value, is_secret: v.is_secret }))
    if (variables.value.length === 0) {
      variables.value.push({ key: '', value: '', is_secret: false })
    }
  }
}, { immediate: true })

async function createEnv() {
  if (!newEnvName.value.trim()) return
  try {
    const env = await envStore.createEnvironment(newEnvName.value.trim())
    selectedEnvId.value = env.id.toString()
    newEnvName.value = ''
    ui.toast('Environment created', 'success')
  } catch (e: any) {
    ui.toast(e.message || 'Create failed', 'error')
  }
}

async function activate() {
  if (!selectedEnvId.value) return
  try {
    await envStore.activateEnvironment(parseInt(selectedEnvId.value))
    ui.toast('Environment activated', 'success')
  } catch (e: any) {
    ui.toast(e.message || 'Activation failed', 'error')
  }
}

async function saveVars() {
  if (!selectedEnvId.value) return
  saving.value = true
  try {
    const vars = variables.value.filter(v => v.key.trim())
    await envStore.setVariables(parseInt(selectedEnvId.value), vars)
    ui.toast('Variables saved', 'success')
  } catch (e: any) {
    ui.toast(e.message || 'Save failed', 'error')
  } finally {
    saving.value = false
  }
}

async function deleteEnv() {
  if (!selectedEnvId.value) return
  try {
    await envStore.deleteEnvironment(parseInt(selectedEnvId.value))
    selectedEnvId.value = ''
    ui.toast('Environment deleted', 'info')
  } catch (e: any) {
    ui.toast(e.message || 'Delete failed', 'error')
  }
}

function addVariable() {
  variables.value.push({ key: '', value: '', is_secret: false })
}

function removeVariable(index: number) {
  variables.value.splice(index, 1)
  if (variables.value.length === 0) variables.value.push({ key: '', value: '', is_secret: false })
}
</script>

<template>
  <FcModal title="Environments" width="560px" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Create new -->
      <div class="flex items-center gap-2">
        <input
          v-model="newEnvName"
          type="text"
          class="flex-1 px-3 py-1.5 text-sm glass-input text-fc-text-primary"
          placeholder="New environment name"
          @keydown.enter="createEnv"
        />
        <FcButton size="sm" @click="createEnv">Add</FcButton>
      </div>

      <!-- Select -->
      <div class="flex items-center gap-2">
        <div class="flex-1">
          <FcDropdown
            :model-value="selectedEnvId"
            :options="envOptions"
            @update:model-value="selectedEnvId = $event"
          />
        </div>
        <FcButton v-if="selectedEnvId" size="sm" @click="activate">Activate</FcButton>
        <FcButton v-if="selectedEnvId" size="sm" variant="danger" @click="deleteEnv">Delete</FcButton>
      </div>

      <!-- Variables -->
      <div v-if="selectedEnvId" class="space-y-2">
        <label class="block text-xs text-fc-text-muted font-medium">Variables</label>
        <div v-for="(v, i) in variables" :key="i" class="flex items-center gap-2">
          <input
            v-model="v.key"
            type="text"
            class="flex-1 px-2 py-1.5 text-xs font-mono glass-input text-fc-text-primary"
            placeholder="Key"
          />
          <input
            v-model="v.value"
            :type="v.is_secret ? 'password' : 'text'"
            class="flex-1 px-2 py-1.5 text-xs font-mono glass-input text-fc-text-primary"
            placeholder="Value"
          />
          <button
            class="p-1 rounded text-fc-text-muted hover:text-fc-red transition-colors shrink-0"
            @click="removeVariable(i)"
          >
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <button class="text-xs text-fc-text-muted hover:text-fc-accent transition-colors" @click="addVariable">
          + Add variable
        </button>
      </div>
    </div>
    <template #footer>
      <FcButton variant="secondary" @click="$emit('close')">Close</FcButton>
      <FcButton v-if="selectedEnvId" :loading="saving" @click="saveVars">Save Variables</FcButton>
    </template>
  </FcModal>
</template>
