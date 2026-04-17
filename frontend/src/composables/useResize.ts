import { ref, onMounted, onUnmounted } from 'vue'

const STORAGE_KEY = 'fc_pane_ratio'
const MIN_PX = 80

export function useResize(containerRef: { value: HTMLElement | null }) {
  const ratio = ref(parseFloat(localStorage.getItem(STORAGE_KEY) || '0.5'))
  let dragging = false

  function onPointerDown(e: PointerEvent) {
    e.preventDefault()
    dragging = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || !containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    const total = rect.height
    if (total <= 0) return
    const y = e.clientY - rect.top
    let newRatio = y / total
    // Enforce min size
    const minRatio = MIN_PX / total
    const maxRatio = 1 - minRatio
    newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio))
    ratio.value = newRatio
  }

  function onPointerUp() {
    if (dragging) {
      dragging = false
      localStorage.setItem(STORAGE_KEY, ratio.value.toFixed(3))
    }
  }

  onMounted(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  })

  onUnmounted(() => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  })

  return { ratio, onPointerDown }
}
