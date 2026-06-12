# OMNI-INVEST SENTINEL — PROJECT CONTEXT

> Dokumen ini adalah referensi lengkap untuk AI assistant (Claude) saat membantu development dashboard Vue.js
> Last updated: 2026-06-11

---

## 🎯 VISI PROYEK

Platform manajemen aset pribadi yang otonom dan cost-efficient. Menggabungkan data investasi yang terfragmentasi (emas, saham, reksadana) ke dalam satu dashboard terpusat dengan notifikasi otomatis berbasis sinyal.

**Tagline UI**: _"Command Center Dashboard"_ — Terasa seperti memantau sistem trading profesional, bukan aplikasi keuangan biasa.

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
│         ▓                                           │
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
│   │   │   ├── AssetFormModal.vue   ← ada field rd_code untuk reksa dana + helper hitung avg_buy_price emas
│   │   │   ├── PLPreviewModal.vue   ← deteksi perubahan emas/saham/reksa/valas
│   │   │   ├── ValasSection.vue     ← tabel posisi valas (dipakai di PortfolioView)
│   │   │   └── ValasFormModal.vue   ← form tambah/edit posisi valas (dipakai di SettingsView)
│   │   └── transactions/
│   │       └── TransactionForm.vue  ← dropdown kode dari portfolio store; pipeline banner biru jika running
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
  --bg: #0a0c10; /* Hitam pekat utama — panel terlihat melayang */
  --bg2: #0f1219; /* Sidebar & modal */
  --bg3: #151a24; /* Card background */
  --surface: #1a2133; /* Table header, surface elements */
  --border: #232d42; /* Semua border */

  /* ── ACCENT COLORS ── */
  --accent: #00e5a0; /* Hijau neon — profit, BUY, status aktif */
  --blue: #0084ff; /* Info teknis Scavenger, secondary action */
  --orange: #ff6b35; /* Messenger role, warning medium */
  --warn: #ffd93d; /* HOLD signal, rebalance alert */
  --danger: #ff4757; /* Loss, SELL, STOPLOSS, critical */

  /* ── TEXT ── */
  --text: #e8edf5; /* Text utama */
  --text2: #8899bb; /* Label, sekunder */
  --text3: #4a5878; /* Caption, placeholder, tersier */

  /* ── SEMANTIC (gunakan KONSISTEN di seluruh app) ── */
  --green: #00e5a0; /* Profit / positif */
  --red: #ff4757; /* Loss / negatif */

  /* ── GLASSMORPHISM ── */
  --glass-bg: rgba(26, 33, 51, 0.7);
  --glass-border: rgba(255, 255, 255, 0.06);
  --glass-blur: blur(10px);

  /* ── GLOW EFFECTS ── */
  --glow-accent: 0 0 12px rgba(0, 229, 160, 0.4);
  --glow-blue: 0 0 12px rgba(0, 132, 255, 0.4);
  --glow-red: 0 0 12px rgba(255, 71, 87, 0.4);
  --glow-warn: 0 0 12px rgba(255, 217, 61, 0.4);
}
```

### Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

--font-ui: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

**Aturan Wajib Typography:**

- Semua **harga** (Rp...), **persentase** (%), **kode saham** (BBCA), **jumlah** → `font-family: var(--font-mono)`
- Semua **heading**, **label**, **navigasi**, **tombol** → `font-family: var(--font-ui)`
- Kolom angka di tabel → tambahkan `font-variant-numeric: tabular-nums` agar sejajar vertikal
- StatCard value → `font-size: min(28px, 6vw)` agar responsif

### Background Grid

```css
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
defineProps({ label: String, value: String, prefix: String, change: String, changeLabel: String,
isPositive: Boolean, variant: { type: String, default: 'default' } //
'default'|'accent'|'warn'|'danger'|'blue' })
```

### SignalBadge

Wajib ada **glow effect** — jangan hanya teks/warna biasa.

```css
.signal-buy {
  background: rgba(0, 229, 160, 0.12);
  color: #00e5a0;
  border: 1px solid rgba(0, 229, 160, 0.4);
  box-shadow: 0 0 8px rgba(0, 229, 160, 0.2);
}
.signal-avg-down {
  background: rgba(0, 132, 255, 0.12);
  color: #0084ff;
  border: 1px solid rgba(0, 132, 255, 0.4);
  box-shadow: 0 0 8px rgba(0, 132, 255, 0.2);
}
.signal-sell {
  background: rgba(255, 71, 87, 0.12);
  color: #ff4757;
  border: 1px solid rgba(255, 71, 87, 0.4);
  box-shadow: 0 0 8px rgba(255, 71, 87, 0.2);
}
.signal-hold {
  background: rgba(255, 217, 61, 0.1);
  color: #ffd93d;
  border: 1px solid rgba(255, 217, 61, 0.4);
  box-shadow: 0 0 8px rgba(255, 217, 61, 0.15);
}
.signal-dca {
  background: rgba(255, 107, 53, 0.1);
  color: #ff6b35;
  border: 1px solid rgba(255, 107, 53, 0.4);
}
.signal-stoploss {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  border: 1px solid #ff4757;
  box-shadow: 0 0 10px rgba(255, 71, 87, 0.35);
  animation: pulse-danger 1.5s ease-in-out infinite;
}
```

### Signal Banner

Full-width di atas halaman, tampil hanya jika ada sinyal.

```css
.banner-critical {
  background: rgba(255, 71, 87, 0.08);
  border: 1px solid rgba(255, 71, 87, 0.35);
  animation: border-pulse 2s infinite;
}
.banner-warn {
  background: rgba(255, 107, 53, 0.08);
  border: 1px solid rgba(255, 107, 53, 0.35);
}
.banner-safe {
  background: rgba(0, 229, 160, 0.06);
  border: 1px solid rgba(0, 229, 160, 0.25);
}
```

### AppSidebar (Glassmorphism)

```css
.sidebar {
  width: 220px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
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
```

### PriceSparkline

Mini chart tanpa sumbu X/Y — hanya tren garis.

```vue
defineProps({ data: Array, // array of numbers changePct: Number, // untuk warna: >= 0 →
var(--green), < 0 → var(--red) width: { default: 60 }, height: { default: 24 } })
```

### Rekomendasi Rebalance

Data `alokasi.rekomendasi` dari API adalah **array object**, bukan array string:

```javascript
// Format yang BENAR dari analyst/engine.py:
rekomendasi = [
  { action: 'KURANG', asset: 'Emas', actual: 47.8, target: 60 },
  { action: 'TAMBAH', asset: 'Saham', actual: 1.4, target: 20 },
  { action: 'KURANG', asset: 'Reksa Dana', actual: 50.8, target: 20 },
]

// Template usage:
// <span :class="rec.action === 'TAMBAH' ? 'clr-green' : 'clr-orange'">{{ rec.action }}</span>
// <span>{{ rec.asset }}</span>
// {{ (rec.actual ?? 0).toFixed(1) }}% → {{ rec.target }}%
```

### AssetFormModal — Field Reksa Dana

Form reksa dana punya field `rd_code` untuk auto-fetch NAB:

```javascript
// emptyForm() untuk reksa:
{ id: '', nama: '', catatan: '', qty_unit: null, avg_buy_nab: null, current_nab: null, rd_code: '' }

// submit() output reksa:
{
  id, nama, qty_unit, avg_buy_nab, current_nab,
  rd_code: 'RD424',   // ← dari URL bibit.id/reksadana/RD424/nama-reksa
  catatan
}
```

---

## 🔌 FLASK API ENDPOINTS

Base URL: `import.meta.env.VITE_API_BASE_URL`

| Method | Endpoint               | Deskripsi                                                             |
| ------ | ---------------------- | --------------------------------------------------------------------- |
| GET    | `/api/portfolio`       | Ambil portofolio (dari local JSON, fallback Firestore)                |
| POST   | `/api/portfolio`       | Simpan portfolio lokal + async Firestore sync + auto-trigger pipeline |
| GET    | `/api/market`          | Harga pasar terbaru                                                   |
| GET    | `/api/report`          | Analyst report + sinyal                                               |
| GET    | `/api/transactions`    | Riwayat transaksi                                                     |
| POST   | `/api/transactions`    | Tambah transaksi + update avg cost portfolio + auto-trigger pipeline  |
| POST   | `/api/run`             | Trigger pipeline manual                                               |
| GET    | `/api/gold-history`    | Historis harga emas harian                                            |
| GET    | `/api/watchlist`       | Daftar saham & reksa dipantau                                         |
| POST   | `/api/watchlist`       | Update watchlist                                                      |
| POST   | `/api/validate-ticker` | Validasi ticker saham Yahoo Finance                                   |

### Struktur Response Penting

```javascript
// GET /api/market → res.data
{
  fetched_at: "ISO string",
  emas: { price, antam_per_gram, change_pct, ... },
  saham: { stocks: { "BBCA.JK": { price, change_pct, ... } } },
  reksadana: {
    reksa_dana: {
      "KODE_INTERNAL": { current_nab, nama, jenis, nav_date, source }
    },
    summary: { total, ok, failed, cached }
  }
}

// GET /api/report → res.data
{
  summary:   { total_modal, total_nilai, total_pl, total_pl_pct },
  signals:   [{ type, aset, priority, alasan, ... }],
  alokasi: {
    aktual:       { emas, saham, reksadana },   // persentase aktual
    target:       { emas, saham, reksa },        // dari portfolio Firestore
    rekomendasi:  [{ action, asset, actual, target }],  // ARRAY OBJECT bukan string!
    total_aset:   number
  },
  emas:      { items: [...], total_modal, total_nilai },
  saham:     { items: [...], total_modal, total_nilai },
  reksadana: { items: [{ id, nama, qty_unit, avg_nab, current_nab, modal, nilai_pasar, pl, pl_pct, signal }] },
  valas: {
    summary: { total_modal, total_nilai, total_pl, total_pl_pct },
    items: [{ id, code, nama, qty_unit, avg_buy_rate, current_rate, change_pct,
               modal, nilai_pasar, pl, pl_pct, signal }]
    // signal valas: BUY | HOLD | SELL_PARTIAL | STOPLOSS | DATA_ERROR
  }
}

// GET /api/portfolio → res.data
{
  emas:      [{ id, nama, qty_gram, avg_buy_price, catatan }],
  saham:     [{ id, ticker, nama, qty_lot, avg_buy_price, support, resistance, stop_loss, catatan }],
  reksadana: [{ id, nama, qty_unit, avg_buy_nab, rd_code, catatan }],  // rd_code untuk auto-fetch NAB
  valas:     [{ id, code, nama, qty_unit, avg_buy_rate, catatan }],
             // id: "{code}_{4-digit-ts}", e.g. "usd_1234"
             // code: "USD"|"SGD"|"EUR"|"JPY"
             // avg_buy_rate: kurs IDR saat beli (bukan total modal!)
             // qty_unit: jumlah unit valas (JPY tanpa desimal, lainnya 2 desimal)
  target_allocation: { emas, saham, reksa }  // key reksa (bukan reksadana)!
}
```

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
state:   { market: null, lastSync: '--', loading: false, goldHistory: [] }
actions: fetchMarket(), fetchGoldHistory()
getters: goldPrice, stockList, goldSparklineData, goldChangePct,
         valasRates  // → market?.valas?.rates ?? {}
                     // format: { USD: { rate, change_pct, status, symbol }, ... }

// portfolio.js
state:   { portfolio: null, originalPortfolio: null, hasChanges: false, loading: false, saving: false }
actions: fetchPortfolio(), savePortfolio(data)
         // savePortfolio(data):
         //   POST /api/portfolio → fetchPortfolio() →
         //   reportStore.startPipelinePolling(Date.now())
getters: emasList, sahamList, reksaList,
         valasList  // → portfolio?.valas ?? []

// report.js
state:   { report: null, loading: false, running: false }
actions: fetchReport(), runPipeline(), setRunning(val), startPipelinePolling(sinceTimestamp)
         // startPipelinePolling(sinceTimestamp):
         //   Set running = true
         //   Poll GET /api/report setiap 15 detik
         //   Jika analyzed_at > sinceTimestamp → running = false, stop polling
         //   Safety timeout 10 menit agar tidak stuck
getters: signals, summary, allokasi, highPrioritySignals, criticalSignals,
         valasSummary,  // → report?.valas?.summary ?? { total_modal:0, total_nilai:0, total_pl:0, total_pl_pct:0 }
         valasItems     // → report?.valas?.items ?? []

// transactions.js
state:   { transactions: [], loading: false }
actions: fetchTransactions(), addTransaction(data)
         // addTransaction(data):
         //   POST /api/transactions →
         //   reportStore.startPipelinePolling(Date.now()) →
         //   fetchTransactions()
```

---

## 🏗️ ARSITEKTUR LOCAL-FIRST PORTFOLIO

STB S905x mengalami Firestore gRPC timeout secara intermittent.
`config/portfolio.json` adalah **single source of truth** untuk semua operasi portfolio.

```
READ:  local JSON → fallback Firestore (jika file tidak ada)
WRITE: local JSON (sync) + Firestore (async background thread)
```

Implikasi untuk FE:

- `GET /api/portfolio` selalu return dari local JSON — cepat, tidak timeout
- Setelah `POST /api/portfolio` → data langsung available di GET berikutnya
- Pipeline auto-trigger setelah transaksi & save portfolio (via `_trigger_pipeline_async()` di backend)
- `reportStore.running` menunjukkan pipeline sedang berjalan — dipakai untuk pipeline banner di UI

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
# .env.local (development)
VITE_API_BASE_URL=http://192.168.192.81:4500/api

# .env.production (build)
VITE_API_BASE_URL=http://192.168.192.81:4500/api
```

---

## 🚀 DEPLOYMENT WORKFLOW

```bash
# 1. Develop di laptop dengan Cursor
# 2. Test via browser dengan VITE_API_BASE_URL mengarah ke STB

# 3. Build + deploy:
./deploy.sh
# → npm run build → git add dist/ → git commit → git push

# 4. Apply di STB:
/home/sidrive/deploy.sh
# → git pull → pm2 restart omni-dashboard
```

---

## 📋 BUSINESS RULES

### Signal Logic

| Signal       | Kondisi                            | Priority | Aset  |
| ------------ | ---------------------------------- | -------- | ----- |
| BUY          | harga ≤ support                    | high     | saham |
| AVG_DOWN     | harga turun ≥ 5% dari avg buy      | high     | saham |
| SELL         | harga ≥ resistance                 | medium   | saham |
| STOPLOSS     | harga ≤ stop loss                  | critical | saham |
| REBALANCE    | alokasi emas > GOLD_MAX_ALLOCATION | medium   | emas  |
| DCA          | reksa dana selalu                  | normal   | reksa |
| SELL_PARTIAL | kurs saat ini ≥ threshold profit   | medium   | valas |
| DATA_ERROR   | gagal fetch kurs dari API          | normal   | valas |

### Kalkulasi P&L

```
Saham:     modal = qty_lot × 100 × avg_buy_price
Emas:      modal = qty_gram × avg_buy_price    ← avg_buy_price = HARGA PER GRAM, bukan total modal!
Reksadana: modal = qty_unit × avg_buy_nab
Valas:     modal = qty_unit × avg_buy_rate     ← avg_buy_rate = kurs IDR saat beli
PL:        nilai_pasar - modal
PL%:       (PL / modal) × 100
```

**Catatan penting emas:** `avg_buy_price` adalah harga per gram (Rp/gram).
Jika user tahu total modal, konversi dulu: `avg_buy_price = total_modal / qty_gram`.
AssetFormModal sudah ada helper untuk ini.

### Rekomendasi Rebalance

```
Emas    : aktual > gold_max (env)          → KURANG
Saham   : aktual < target.saham - 5       → TAMBAH
Reksa   : aktual > target.reksa + 5       → KURANG
Reksa   : aktual < target.reksa - 5       → TAMBAH
target  : dari portfolio.target_allocation (Firestore), key = "reksa"
```

### Valas — Mata Uang yang Didukung

```javascript
const FLAG_MAP = { USD: '🇺🇸', SGD: '🇸🇬', EUR: '🇪🇺', JPY: '🇯🇵' }
// JPY: qty tanpa desimal, step 100
// Lainnya: qty 2 desimal, step 0.01
// Simbol: USD→$, SGD→S$, EUR→€, JPY→¥
// ID format: "{code.toLowerCase()}_{4-digit-timestamp}" cth: "usd_1234"
```

### Saran Lot (One-Tap Eksekusi)

```javascript
const dana = summary.total_nilai * 0.1
const hargaPerLot = market_price * 100
const saranLot = Math.floor(dana / hargaPerLot)
```

---

## 🔧 UTILS

```javascript
// formatters.js
formatRupiah(n) // "Rp1.234.567"
formatJuta(n) // "120.6"
formatPct(n) // "+12.96%" / "-3.2%"
formatGram(n) // "10.5g"
colorClass(n) // 'text-green' / 'text-red'
arrowIcon(n) // '▲' / '▼'

// calculator.js
calcPL(modal, nilai) // { pl, pl_pct }
calcAlokasi(emas, saham, reksa) // { emas_pct, saham_pct, reksa_pct }
suggestLot(totalAset, harga) // jumlah lot disarankan
generateSparklineData(changePct) // array 7 titik simulasi
```

---

## 🧠 ATURAN PENTING UNTUK AI

1. **JANGAN Firebase JS SDK** — semua via Flask API menggunakan axios
2. **API URL** dari `import.meta.env.VITE_API_BASE_URL`
3. **dist/ ikut di git** — STB tidak build sendiri, deploy via `./deploy.sh`
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
19. **alokasi.rekomendasi** adalah array object `{action, asset, actual, target}` — BUKAN array string
20. **target_allocation** di portfolio pakai key `reksa` (bukan `reksadana`)
21. **rd_code** di reksa dana portfolio — dari URL `bibit.id/reksadana/RD424/...`, dipakai pipeline untuk auto-fetch NAB
22. **current_nab** reksa dana — field yang dibaca analyst engine, bukan `nab`
23. **savePortfolio payload WAJIB include SEMUA key** — jika ada aset baru (valas dll), tambahkan ke payload di `portfolio.js → savePortfolio()`, jika tidak data akan hilang saat save
24. **localPortfolio di SettingsView WAJIB include semua key** — `{ emas, saham, reksadana, target_allocation, valas, ... }` — key yang tidak ada akan di-overwrite kosong saat simpan
25. **avg_buy_price emas = harga per gram** — BUKAN total modal. Jangan biarkan user salah input. AssetFormModal sudah ada helper konversi total modal → per gram
26. **PLPreviewModal deteksi perubahan** — saat menambah aset baru, tambahkan `detectChanges` untuk tipe baru, tambahkan ke `allChanges`, dan tambahkan baris di tabel perbandingan
27. **SignalBadge map** — saat ada signal type baru dari backend, tambahkan ke map di `signalClass()` di SignalBadge.vue, jika tidak akan fallback ke styling 'hold' (kuning)
28. **startPipelinePolling(Date.now())** dipanggil dari `portfolio.js` (setelah savePortfolio) dan `transactions.js` (setelah addTransaction) — jangan pakai setTimeout manual
29. **reportStore.running** digunakan untuk pipeline status banner di UI — set via `startPipelinePolling()`, bukan di-set manual dari komponen
30. **jenis_aset di transaksi selalu lowercase** — `"saham"`, `"reksa"`, `"emas"`, `"valas"` (backend field_map pakai key ini)
31. **field timestamp di collection transactions** Firestore adalah `"timestamp"` — bukan `"tanggal"` atau `"date"`
32. **Dropdown kode TransactionForm** diisi dari `portfolioStore` sesuai `jenis_aset` — bukan hardcoded atau dari watchlist

---

_Last updated: 2026-06-11_
_Design: "Deep Space & Neon Accents" — Command Center Dashboard_
_Stack: Vue 3 + Vite + Pinia + Vue Router + Axios + Chart.js_
_Font: Inter (UI) + JetBrains Mono (data angka)_
_Backend: Python Flask + Firebase Firestore + FCM_
_Server: Armbian S905x STB — IP: 192.168.192.81_
_Fitur aktif: Emas, Saham, Reksa Dana, Valas (USD/SGD/EUR/JPY)_
