import { ref, onMounted, onUnmounted } from 'vue'

// Heuristik viewport dari design handoff: STB/kiosk (fisik 1024x768) harus
// terdeteksi. Rentang dobel di bawah menutupi dua kasus yang sudah terkonfirmasi:
//  - 960-1088 x 704-832  → resize manual browser desktop persis ke 1024x768
//  - 1150-1260 x 860-950 → hardware STB asli, yang ternyata melaporkan
//    window.innerWidth/innerHeight ~1205x904 (rasio 4:3 sama, discale ~1.18x
//    oleh device — kemungkinan devicePixelRatio/zoom OS STB di bawah 1),
//    dikonfirmasi lewat ViewportDebugBadge di lapangan.
// TODO: kalau ada unit STB lain dengan angka berbeda lagi, viewport sniffing
// makin rapuh — pertimbangkan deteksi via build flag/route khusus (sudah
// disarankan di README design handoff) alih-alih terus menambah rentang.
export function useSTBMode() {
  const isSTB = ref(false)
  // Faktor scale supaya frame fisik 1024x768 (StbDashboardView.vue) mengisi
  // penuh viewport yang sungguhan dilaporkan device (lihat catatan di atas —
  // hardware STB melaporkan CSS pixel berbeda dari resolusi panel-nya).
  const scale = ref(1)

  function update() {
    const w = window.innerWidth
    const h = window.innerHeight
    const isDesktopTestRange = w >= 960 && w <= 1088 && h >= 704 && h <= 832
    const isRealStbRange = w >= 1150 && w <= 1260 && h >= 860 && h <= 950
    isSTB.value = isDesktopTestRange || isRealStbRange
    scale.value = Math.min(w / 1024, h / 768)
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })
  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { isSTB, scale }
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
