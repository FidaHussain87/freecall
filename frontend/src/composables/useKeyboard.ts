import { onMounted, onUnmounted } from 'vue'
import { useRequestStore } from '@/stores/request'
import { useUiStore } from '@/stores/ui'

export function useKeyboard() {
  function handler(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey

    // Cmd/Ctrl+Enter: Send request
    if (mod && e.key === 'Enter') {
      e.preventDefault()
      const req = useRequestStore()
      if (!req.sending) req.sendRequest()
      return
    }

    // Cmd/Ctrl+S: Save request modal
    if (mod && e.key === 's') {
      e.preventDefault()
      const ui = useUiStore()
      ui.openModal('save-request')
      return
    }

    // Escape: Close modal
    if (e.key === 'Escape') {
      const ui = useUiStore()
      if (ui.activeModal) {
        ui.closeModal()
        return
      }
    }

    // Cmd/Ctrl+L: Focus URL bar
    if (mod && e.key === 'l') {
      e.preventDefault()
      const urlInput = document.querySelector<HTMLInputElement>('[data-url-input]')
      urlInput?.focus()
      urlInput?.select()
    }
  }

  onMounted(() => window.addEventListener('keydown', handler))
  onUnmounted(() => window.removeEventListener('keydown', handler))
}
