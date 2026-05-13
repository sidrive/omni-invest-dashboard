import { ref } from 'vue'

// Module-level singleton — shared across the entire app
const toasts = ref([])
let _id = 0

export function useToast() {
  function showToast(message, type = 'info', duration = 3000) {
    const id = ++_id
    toasts.value.push({ id, message, type })
    setTimeout(() => dismiss(id), duration)
  }

  function dismiss(id) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return { toasts, showToast, dismiss }
}
