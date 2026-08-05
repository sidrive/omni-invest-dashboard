<script setup>
// TEMP DEBUG — dipasang untuk mendiagnosa kenapa mode STB (lihat useSTBMode.js)
// tidak aktif di perangkat STB sungguhan padahal resolusinya seharusnya 1024x768.
// Hapus komponen ini + pemanggilannya di App.vue setelah rentang deteksi di
// useSTBMode.js sudah dikonfirmasi cocok dengan angka yang dilaporkan hardware asli.
import { ref, onMounted, onUnmounted } from 'vue'

const info = ref({ w: 0, h: 0, dpr: 1, screenW: 0, screenH: 0 })

function update() {
  info.value = {
    w: window.innerWidth,
    h: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
    screenW: window.screen?.width ?? 0,
    screenH: window.screen?.height ?? 0,
  }
}

onMounted(() => {
  update()
  window.addEventListener('resize', update)
})
onUnmounted(() => window.removeEventListener('resize', update))
</script>

<template>
  <div class="viewport-debug-badge">
    viewport {{ info.w }}×{{ info.h }} · dpr {{ info.dpr }} · screen {{ info.screenW }}×{{ info.screenH }}
  </div>
</template>

<style scoped>
.viewport-debug-badge {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 99999;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.75);
  color: #00e5a0;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 11px;
  pointer-events: none;
}
</style>
