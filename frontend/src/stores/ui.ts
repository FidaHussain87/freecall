import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SidebarTab = 'collections' | 'history'
export type RequestTab = 'params' | 'headers' | 'body' | 'auth'
export type ResponseTab = 'body' | 'headers' | 'raw'
export type ModalName = 'save-request' | 'new-collection' | 'environment' | 'import' | 'confirm' | null

function getInitialSidebar(): boolean {
  const stored = localStorage.getItem('fc_sidebar_open')
  if (stored !== null) return stored === 'true'
  return window.innerWidth >= 1024
}

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(getInitialSidebar())
  const sidebarTab = ref<SidebarTab>('collections')
  const requestTab = ref<RequestTab>('params')
  const responseTab = ref<ResponseTab>('body')
  const paneRatio = ref(0.5)
  const activeModal = ref<ModalName>(null)
  const modalProps = ref<Record<string, any>>({})

  // Toast system
  const toasts = ref<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([])
  let toastId = 0

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
    localStorage.setItem('fc_sidebar_open', String(sidebarOpen.value))
  }

  function openModal(name: ModalName, props: Record<string, any> = {}) {
    activeModal.value = name
    modalProps.value = props
  }

  function closeModal() {
    activeModal.value = null
    modalProps.value = {}
  }

  function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3500)
  }

  return {
    sidebarOpen, sidebarTab, requestTab, responseTab, paneRatio,
    activeModal, modalProps, toasts,
    toggleSidebar, openModal, closeModal, toast,
  }
})
