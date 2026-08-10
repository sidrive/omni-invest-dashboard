<script setup>
// Shell yang sama dipakai untuk keempat sub-state (menjelang adzan/iqomah,
// waktu sholat, menjelang imsak) — cuma subLabel/prayerName/showCountdown
// yang beda, persis seperti desain (lihat StbDashboardView.vue untuk
// mapping fase -> props ini).
defineProps({
  subLabel: { type: String, required: true },
  prayerName: { type: String, required: true },
  showCountdown: { type: Boolean, default: true },
  countdownText: { type: String, default: '00:00' },
  clockText: { type: String, default: '00:00:00' },
})
</script>

<template>
  <div class="ov-root">
    <div class="ov-border"></div>
    <div class="ov-hatch"></div>

    <div class="ov-clock mono">{{ clockText }} WIB</div>

    <div class="ov-crescent"></div>

    <svg width="120" height="46" viewBox="0 0 120 46" class="ov-mosque">
      <path
        d="M60 2 C69 2 74 10 74 17 L74 24 L46 24 L46 17 C46 10 51 2 60 2 Z"
        fill="#e8c76f"
        opacity="0.9"
      />
      <rect x="30" y="24" width="60" height="20" fill="#e8c76f" opacity="0.9" />
      <rect x="12" y="30" width="8" height="14" fill="#e8c76f" opacity="0.75" />
      <rect x="100" y="30" width="8" height="14" fill="#e8c76f" opacity="0.75" />
      <circle cx="16" cy="26" r="4" fill="#e8c76f" opacity="0.75" />
      <circle cx="104" cy="26" r="4" fill="#e8c76f" opacity="0.75" />
    </svg>

    <div class="ov-sublabel">{{ subLabel }}</div>
    <div class="ov-prayer-name">{{ prayerName }}</div>

    <div v-if="showCountdown" class="ov-countdown mono">{{ countdownText }}</div>
    <div v-else class="ov-ring">
      <div class="ov-ring-pulse"></div>
      <div class="ov-ring-core"></div>
    </div>

    <div class="ov-footnote">Kembali otomatis ke dashboard Omni-Invest &amp; Zakanet</div>
  </div>
</template>

<style scoped>
.mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }

.ov-root {
  position: absolute;
  inset: 0;
  /* Leaflet menaruh kontrolnya sendiri (attribution, dll) di z-index ~1000
     di dalam stacking context peta — 50 (sesuai spec desain) kalah kalau
     stacking context ancestor-nya tidak dibatasi, jadi dinaikkan jauh di
     atas itu supaya overlay ini benar2 menutup semuanya. */
  z-index: 9999;
  animation: ovFadeIn 0.6s ease;
  background: radial-gradient(ellipse at 50% 30%, #123024 0%, #081712 65%, #050d0a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #f2e6c2;
  overflow: hidden;
}
@keyframes ovFadeIn { from { opacity: 0; } to { opacity: 1; } }

.ov-border {
  position: absolute;
  inset: 14px;
  border: 1px solid rgba(232, 199, 111, 0.25);
  border-radius: 6px;
  pointer-events: none;
}
.ov-hatch {
  position: absolute;
  inset: 14px;
  border-radius: 6px;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    45deg,
    rgba(232, 199, 111, 0.05) 0px,
    rgba(232, 199, 111, 0.05) 1px,
    transparent 1px,
    transparent 14px
  );
}

.ov-clock {
  font-size: 14px;
  letter-spacing: 0.08em;
  color: rgba(242, 230, 194, 0.55);
  position: absolute;
  top: 34px;
}

.ov-crescent {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e8c76f;
  box-shadow: 20px -8px 0 0 #081712;
  margin-bottom: 22px;
}

.ov-mosque { opacity: 0.85; margin-bottom: 8px; }

.ov-sublabel {
  font-size: 13px;
  letter-spacing: 0.14em;
  color: rgba(232, 199, 111, 0.85);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.ov-prayer-name { font-size: 44px; font-weight: 800; letter-spacing: 0.01em; margin-bottom: 18px; }

.ov-countdown { font-size: 88px; font-weight: 700; color: #f2e6c2; letter-spacing: 0.02em; }

.ov-ring { position: relative; width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; }
.ov-ring-pulse {
  position: absolute;
  inset: 0;
  border: 2px solid #e8c76f;
  border-radius: 50%;
  animation: ovRingPulse 1.8s ease-out infinite;
}
.ov-ring-core {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(232, 199, 111, 0.12);
  border: 1px solid rgba(232, 199, 111, 0.4);
}
@keyframes ovRingPulse {
  0% { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1.6); opacity: 0; }
}

.ov-footnote { font-size: 11px; color: rgba(242, 230, 194, 0.4); margin-top: 26px; letter-spacing: 0.02em; }

/* Font besar (44/88px) didesain untuk canvas 1024x768 — device nyata lebih
   besar sedikit (fluid layout, bukan transform:scale(), lihat catatan di
   StbDashboardView.vue) jadi elemen ini akan terlihat sedikit lebih kecil
   relatif ke layar dibanding mockup asli. Guard kecil untuk viewport yang
   jauh lebih sempit dari target supaya teks tidak overflow. */
@media (max-width: 700px) {
  .ov-prayer-name { font-size: 32px; }
  .ov-countdown { font-size: 56px; }
}
</style>
