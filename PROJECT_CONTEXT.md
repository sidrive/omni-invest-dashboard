# OMNI-INVEST SENTINEL — PROJECT CONTEXT
> Dokumen ini adalah referensi lengkap untuk AI assistant (Claude) saat membantu development dashboard Vue.js

---

## 🎯 VISI PROYEK

Platform manajemen aset pribadi yang otonom dan cost-efficient. Menggabungkan data investasi yang terfragmentasi (emas, saham, reksadana) ke dalam satu dashboard terpusat dengan notifikasi otomatis berbasis sinyal.

**Tagline UI**: *"Command Center Dashboard"* — Terasa seperti memantau sistem trading profesional, bukan aplikasi keuangan biasa.

---

## 🏗️ ARSITEKTUR SISTEM

```
┌─────────────────────────────────────────────────────┐
│                   STB (Armbian S905x)                │
│                                                     │
│  ┌─────────────┐    ┌─────────────┐                 │
│  │  Python     │    │  Flask API  │◄── Browser      │
│  │  Pipeline   │───►│  :4500      │                 │
│  │             │    │  serve dist/│                 │
│  └──────┬──────┘    └─────────────┘                 │
│         ▼                                           │
│  ┌─────────────────────────────────────────┐        │
│  │  Firebase: Firestore DB + FCM Notif     │        │
│  └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘

💻 Laptop → develop + npm run build → git push (include dist/)
🖥️ STB    → git pull → pm2 restart → Flask serve dist/
```

---

## 📁 STRUKTUR PROJECT VUE

```
omni-invest-dashboard/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   └── index.js
│   ├── stores/
│   │   ├── market.js
│   │   ├── portfolio.js
│   │   ├── report.js
│   │   └── transactions.js
│   ├── views/
│   │   ├── DashboardView.vue
│   │   ├── PortfolioView.vue
│   │   ├── AlertsView.vue
│   │   ├── SettingsView.vue
│   │   ├── ScavengerView.vue
│   │   ├── AnalystView.vue
│   │   └── TransactionsView.vue
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.vue
│   │   │   └── AppTopbar.vue
│   │   ├── ui/
│   │   │   ├── StatCard.vue
│   │   │   ├── SignalBadge.vue
│   │   │   ├── RoleBadge.vue
│   │   │   ├── LoadingSpinner.vue
│   │   │   └── ToastNotif.vue
│   │   ├── charts/
│   │   │   ├── AllocationChart.vue
│   │   │   └── PriceSparkline.vue
│   │   ├── portfolio/
│   │   │   ├── AssetTable.vue
│   │   │   ├── AssetFormModal.vue
│   │   │   └── PLPreviewModal.vue
│   │   └── transactions/
│   │       └── TransactionForm.vue
│   ├── router/index.js
│   ├── utils/
│   │   ├── formatters.js
│   │   └── calculator.js
│   ├── App.vue
│   └── main.js
├── .env.local
├── .env.production
├── .gitignore          # dist/ TIDAK di-ignore
├── deploy.sh
├── PROJECT_CONTEXT.md
├── CLAUDE_PROMPTS.md
├── vite.config.js
└── package.json
```

---

## 🎨 DESIGN SYSTEM — "Deep Space & Neon Accents"

### Filosofi Desain
Dashboard ini harus terasa seperti **command center sistem trading profesional** — bukan aplikasi keuangan biasa. Presisi, gelap, data-dense. Setiap elemen memberikan informasi tanpa noise visual. Dibaca nyaman di malam hari dengan kontras tinggi.

### Color Palette

```css
:root {
  /* ── BACKGROUNDS ── */
  --bg:      #0a0c10;   /* Hitam pekat utama — panel terlihat melayang */
  --bg2:     #0f1219;   /* Sidebar & modal */
  --bg3:     #151a24;   /* Card background */
  --surface: #1a2133;   /* Table header, surface elements */
  --border:  #232d42;   /* Semua border */

  /* ── ACCENT COLORS ── */
  --accent:  #00e5a0;   /* Hijau neon — profit, BUY, status aktif */
  --blue:    #0084ff;   /* Info teknis Scavenger, secondary action */
  --orange:  #ff6b35;   /* Messenger role, warning medium */
  --warn:    #ffd93d;   /* HOLD signal, rebalance alert */
  --danger:  #ff4757;   /* Loss, SELL, STOPLOSS, critical */

  /* ── TEXT ── */
  --text:    #e8edf5;   /* Text utama */
  --text2:   #8899bb;   /* Label, sekunder */
  --text3:   #4a5878;   /* Caption, placeholder, tersier */

  /* ── SEMANTIC (gunakan KONSISTEN di seluruh app) ── */
  --green:   #00e5a0;   /* Profit / positif */
  --red:     #ff4757;   /* Loss / negatif */

  /* ── GLASSMORPHISM ── */
  --glass-bg:     rgba(26, 33, 51, 0.7);
  --glass-border: rgba(255, 255, 255, 0.06);
  --glass-blur:   blur(10px);

  /* ── GLOW EFFECTS ── */
  --glow-accent: 0 0 12px rgba(0, 229, 160, 0.4);
  --glow-blue:   0 0 12px rgba(0, 132, 255, 0.4);
  --glow-red:    0 0 12px rgba(255, 71, 87, 0.4);
  --glow-warn:   0 0 12px rgba(255, 217, 61, 0.4);
}
```

### Typography

```css
/* Import di index.html atau App.vue */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

--font-ui:   'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

**Aturan Wajib Typography:**
- Semua **harga** (Rp...), **persentase** (%), **kode saham** (BBCA), **jumlah** → `font-family: var(--font-mono)`
- Semua **heading**, **label**, **navigasi**, **tombol** → `font-family: var(--font-ui)`
- Kolom angka di tabel → tambahkan `font-variant-numeric: tabular-nums` agar sejajar vertikal
- StatCard value → `font-size: min(28px, 6vw)` agar responsif

### Background Grid

```css
/* Memberikan kesan sistem teknis / terminal */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 229, 160, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 229, 160, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}
```

---

## 🧩 SPESIFIKASI KOMPONEN DETAIL

### StatCard
Angka besar, langsung terbaca saat app dibuka.

```
┌──────────────────────────────┐  ← border-left 3px var(--accent) jika variant=accent
│ TOTAL ASET              [i]  │  ← label: font-mono, 9px, --text3, letter-spacing 2px
│                              │
│  Rp 120.6 Jt                 │  ← value: font-mono, 28px+, bold
│  ▲ +12.96% bulan ini         │  ← change: font-mono, 11px, --green atau --red
└──────────────────────────────┘
```

```vue
<!-- Props -->
defineProps({
  label: String,
  value: String,       // sudah diformat, misal "120.6 Jt"
  prefix: String,      // misal "Rp"
  change: String,      // misal "+12.96%"
  changeLabel: String, // misal "bulan ini"
  isPositive: Boolean,
  variant: {           // 'default' | 'accent' | 'warn' | 'danger' | 'blue'
    type: String,
    default: 'default'
  }
})
```

### SignalBadge
Wajib ada **glow effect** — jangan hanya teks/warna biasa.

```css
.signal-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: uppercase;
}

.signal-buy      { background: rgba(0,229,160,0.12); color: #00e5a0; border: 1px solid rgba(0,229,160,0.4); box-shadow: 0 0 8px rgba(0,229,160,0.2); }
.signal-avg-down { background: rgba(0,132,255,0.12); color: #0084ff; border: 1px solid rgba(0,132,255,0.4); box-shadow: 0 0 8px rgba(0,132,255,0.2); }
.signal-sell     { background: rgba(255,71,87,0.12);  color: #ff4757; border: 1px solid rgba(255,71,87,0.4);  box-shadow: 0 0 8px rgba(255,71,87,0.2); }
.signal-hold     { background: rgba(255,217,61,0.1);  color: #ffd93d; border: 1px solid rgba(255,217,61,0.4); box-shadow: 0 0 8px rgba(255,217,61,0.15); }
.signal-dca      { background: rgba(255,107,53,0.1);  color: #ff6b35; border: 1px solid rgba(255,107,53,0.4); }
.signal-stoploss {
  background: rgba(255,71,87,0.2);
  color: #ff4757;
  border: 1px solid #ff4757;
  box-shadow: 0 0 10px rgba(255,71,87,0.35);
  animation: pulse-danger 1.5s ease-in-out infinite;
}

@keyframes pulse-danger {
  0%, 100% { box-shadow: 0 0 8px rgba(255,71,87,0.3); }
  50%      { box-shadow: 0 0 16px rgba(255,71,87,0.6); }
}
```

### Signal Banner
Full-width di atas halaman, tampil hanya jika ada sinyal.

```
/* CRITICAL / HIGH — merah */
┌────────────────────────────────────────────────────────┐
│ 🚨  [CRITICAL] STOPLOSS BBCA — Rp5.500 tersentuh!      │
│     Segera review posisi Anda!            [Lihat →]    │
└────────────────────────────────────────────────────────┘

/* MEDIUM — oranye/kuning */
┌────────────────────────────────────────────────────────┐
│ ⚡  2 SINYAL AKTIF: AVG_DOWN BBRI, REBALANCE EMAS       │
│     Buka Alerts untuk detail.             [Lihat →]    │
└────────────────────────────────────────────────────────┘

/* AMAN — hijau */
┌────────────────────────────────────────────────────────┐
│ ✅  Semua posisi aman — tidak ada sinyal aktif           │
└────────────────────────────────────────────────────────┘
```

```css
.banner-critical {
  background: rgba(255, 71, 87, 0.08);
  border: 1px solid rgba(255, 71, 87, 0.35);
  animation: border-pulse 2s infinite;
}
.banner-warn    { background: rgba(255, 107, 53, 0.08); border: 1px solid rgba(255, 107, 53, 0.35); }
.banner-safe    { background: rgba(0, 229, 160, 0.06);  border: 1px solid rgba(0, 229, 160, 0.25); }
```

### AppSidebar (Glassmorphism)

```css
.sidebar {
  width: 220px;
  background: var(--glass-bg);        /* rgba(26, 33, 51, 0.7) */
  backdrop-filter: var(--glass-blur); /* blur(10px) */
  border-right: 1px solid var(--glass-border);
  position: sticky;
  top: 0;
  height: 100vh;
}

.nav-item.active {
  border-left: 2px solid var(--accent);
  background: rgba(0, 229, 160, 0.06);
  color: var(--accent);
}

/* Live status dot */
.dot-live {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: var(--glow-accent);
  animation: pulse-live 2s infinite;
}
```

### PriceSparkline
Mini chart tanpa sumbu X/Y — hanya tren garis.

```
BBCA  Rp6.150  ▲0.40%  ╱╱╲╲╱╱╱   ← sparkline 7 titik, 60×24px
BBRI  Rp3.200  ▼1.84%  ╱╲╲╲╱╲╲
TLKM  Rp2.960  ▲0.00%  ────────
```

- Implementasi: SVG `<polyline>` sederhana atau Canvas 2D
- Width: 60px, Height: 24px, no padding
- Line color: `var(--green)` jika `change_pct >= 0`, `var(--red)` jika negatif
- Line width: 1.5px, no fill, no axis, no labels
- Data points: simulasi 7 titik dari `change_pct` jika tidak ada historis

```vue
<!-- PriceSparkline.vue props -->
defineProps({
  data: Array,        // array of numbers, misal [100, 102, 101, 103, 102, 104, 105]
  changePct: Number,  // untuk menentukan warna
  width: { default: 60 },
  height: { default: 24 }
})
```

### Allocation Progress Bar

```
🥇 Emas    Target 25%  [████████████░░░░░░] 34.2%  ⚠️ Over
📈 Saham   Target 50%  [██████████████████░] 47.3%
🏦 Reksa   Target 25%  [████████░░░░░░░░░░] 18.5%
```

- Bar gradient: Emas=`#ffd93d→#ff9f43`, Saham=`#0084ff→#00e5a0`, Reksa=`#a29bfe→#6c5ce7`
- Jika aktual > target → bar warna berubah ke `--warn`, tampil ikon ⚠️
- Animasi `transition: width 0.8s ease-out` saat pertama render

### TransactionForm — One-Tap Eksekusi
Saat dibuka dari tombol "Eksekusi" di halaman Alerts:

```
┌─────────────────────────────────────┐
│ 💚 Eksekusi BUY — BBCA              │
│─────────────────────────────────────│
│ Harga saat ini   : Rp6.150          │  ← pre-filled, readonly
│ Modal tersedia   : ~Rp12.056.000    │  ← 10% dari total aset
│ Saran lot        : 19 lot           │  ← floor(dana / (harga × 100))
│─────────────────────────────────────│
│ Qty [   19  ] lot    Harga [6150]   │  ← bisa diubah user
│ Total: Rp11.685.000                 │  ← reactive
│─────────────────────────────────────│
│ [✅ Konfirmasi Beli]  [Batal]        │
└─────────────────────────────────────┘
```

---

## 🔌 FLASK API ENDPOINTS

Base URL: `import.meta.env.VITE_API_BASE_URL`

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/portfolio` | Ambil portofolio |
| POST | `/api/portfolio` | Simpan portofolio |
| GET | `/api/market` | Harga pasar terbaru |
| GET | `/api/report` | Analyst report + sinyal |
| GET | `/api/transactions` | Riwayat transaksi |
| POST | `/api/transactions` | Tambah transaksi |
| POST | `/api/run` | Trigger pipeline manual |

---

## 📦 DEPENDENCIES

```json
{
  "dependencies": {
    "vue": "^3.4.x",
    "vue-router": "^4.x",
    "pinia": "^2.x",
    "axios": "^1.x",
    "chart.js": "^4.x",
    "vue-chartjs": "^5.x"
  }
}
```

---

## 🔄 STATE MANAGEMENT (PINIA)

```javascript
// market.js
state:   { market: null, lastSync: '--', loading: false }
actions: fetchMarket()
getters: goldPrice, stockList

// portfolio.js
state:   { portfolio: null, originalPortfolio: null, hasChanges: false, loading: false, saving: false }
actions: fetchPortfolio(), savePortfolio(data)

// report.js
state:   { report: null, loading: false }
actions: fetchReport(), runPipeline()
getters: signals, summary, allokasi, highPrioritySignals, criticalSignals

// transactions.js
state:   { transactions: [], loading: false }
actions: fetchTransactions(), addTransaction(data)
```

---

## 🛣️ ROUTING

```javascript
{ path: '/',             name: 'dashboard',    component: DashboardView    },
{ path: '/portfolio',    name: 'portfolio',    component: PortfolioView    },
{ path: '/alerts',       name: 'alerts',       component: AlertsView       },
{ path: '/settings',     name: 'settings',     component: SettingsView     },
{ path: '/scavenger',    name: 'scavenger',    component: ScavengerView    },
{ path: '/analyst',      name: 'analyst',      component: AnalystView      },
{ path: '/transactions', name: 'transactions', component: TransactionsView },
```

---

## ⚙️ ENVIRONMENT

```bash
VITE_API_BASE_URL=http://192.168.192.81:4500/api
```

---

## 🚀 DEPLOYMENT

```bash
# Laptop:
./deploy.sh  # build + commit dist/ + push

# STB:
/home/sidrive/deploy.sh  # pull + pm2 restart
```

---

## 📋 BUSINESS RULES

### Signal Logic
| Signal | Kondisi | Priority |
|--------|---------|----------|
| BUY | harga ≤ support | high |
| AVG_DOWN | harga turun ≥ 5% dari avg buy | high |
| SELL | harga ≥ resistance | medium |
| STOPLOSS | harga ≤ stop loss | critical |
| REBALANCE | alokasi emas > 30% | medium |
| DCA | reksa dana selalu | normal |

### Kalkulasi P&L
```
Saham:     modal = qty_lot × 100 × avg_buy_price
Emas:      modal = qty_gram × avg_buy_price
Reksadana: modal = qty_unit × avg_buy_nab
PL:        nilai_pasar - modal
PL%:       (PL / modal) × 100
```

### Saran Lot (One-Tap Eksekusi)
```javascript
const dana = summary.total_nilai * 0.1      // 10% total aset
const hargaPerLot = market_price * 100      // 1 lot = 100 lembar
const saranLot = Math.floor(dana / hargaPerLot)
```

---

## 🔧 UTILS

```javascript
// formatters.js
formatRupiah(n)        // "Rp1.234.567"
formatJuta(n)          // "120.6"
formatPct(n)           // "+12.96%" / "-3.2%"
formatGram(n)          // "10.5g"
colorClass(n)          // 'text-green' / 'text-red'
arrowIcon(n)           // '▲' / '▼'

// calculator.js
calcPL(modal, nilai)              // { pl, pl_pct }
calcAlokasi(emas, saham, reksa)   // { emas_pct, saham_pct, reksa_pct }
suggestLot(totalAset, harga)      // jumlah lot disarankan
generateSparklineData(changePct)  // array 7 titik simulasi
```

---

## 🧠 ATURAN PENTING UNTUK AI

1. **JANGAN Firebase JS SDK** — semua via Flask API menggunakan axios
2. **API URL** dari `import.meta.env.VITE_API_BASE_URL`
3. **dist/ ikut di git** — STB tidak build sendiri
4. **Vue 3 `<script setup>`** — selalu Composition API
5. **JetBrains Mono** untuk SEMUA angka, harga, kode saham, persentase
6. **CSS Variables** — jangan hardcode warna
7. **`font-variant-numeric: tabular-nums`** pada kolom tabel angka
8. **Glassmorphism sidebar** — `var(--glass-bg)` + `var(--glass-blur)`
9. **Glow pada SignalBadge** — `box-shadow` neon tipis sesuai warna
10. **Signal Banner** — selalu tampil di atas halaman (merah/oranye/hijau)
11. **PriceSparkline** — wajib di setiap baris harga saham
12. **One-Tap Eksekusi** — modal pre-filled + saran lot di halaman Alerts
13. **Error handling** — try/catch + toast di semua API call
14. **Loading state** — spinner saat fetch
15. **Pinia stores** — fetch via store, bukan langsung di component
16. **Auto-refresh 60s** — Dashboard dan Alerts
17. **Color konsisten** — `--green` profit, `--red` loss di SELURUH app
18. **Responsive** — sidebar collapse di mobile < 768px

---

*Last updated: 2026-05-12*
*Design: "Deep Space & Neon Accents" — Command Center Dashboard*
*Stack: Vue 3 + Vite + Pinia + Vue Router + Axios + Chart.js*
*Font: Inter (UI) + JetBrains Mono (data angka)*
*Backend: Python Flask + Firebase Firestore + FCM*
*Server: Armbian S905x STB — IP: 192.168.192.81*
