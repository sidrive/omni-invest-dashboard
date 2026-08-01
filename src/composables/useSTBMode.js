import { ref, onMounted, onUnmounted } from 'vue'

// Heuristik viewport dari design handoff: STB/kiosk 1024x768 terdeteksi lewat
// rentang lebar 960-1088 & tinggi 704-832 (toleransi kecil di sekitar 1024x768
// persis). TODO: kalau hardware STB asli ternyata melaporkan resolusi lain,
// sesuaikan rentang ini atau ganti ke deteksi device/route eksplisit.
export function useSTBMode() {
  const isSTB = ref(false)

  function update() {
    const w = window.innerWidth
    const h = window.innerHeight
    isSTB.value = w >= 960 && w <= 1088 && h >= 704 && h <= 832
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })
  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { isSTB }
}

export function useClock() {
  const now = ref(new Date())
  let timer = null

  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date()
    }, 1000)
  })
  onUnmounted(() => clearInterval(timer))

  return { now }
}
