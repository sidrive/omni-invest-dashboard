# CLAUDE PROMPTS — OMNI-INVEST DASHBOARD

> Kumpulan prompt siap pakai di Cursor editor dengan Claude extension
> Selalu sertakan PROJECT_CONTEXT.md sebagai context sebelum menjalankan prompt ini
> Last updated: 2026-06-05

---

## 📌 CARA PAKAI DI CURSOR

1. Buka Cursor editor, buka folder `omni-invest-dashboard`
2. Tekan `Cmd+L` untuk buka Claude chat
3. Ketik `@PROJECT_CONTEXT.md` untuk sertakan sebagai context
4. Copy-paste prompt yang dibutuhkan
5. Claude generate code sesuai konteks project

**Shortcut penting:**

- `Cmd+L` → Claude chat panel
- `Cmd+K` → Inline edit (select kode dulu)
- `Cmd+I` → Composer (generate file baru)
- `@filename` → Reference file sebagai context

---

## 🚀 PROMPT 01 — PROJECT INITIALIZATION

```
@PROJECT_CONTEXT.md

Setup fondasi project Vue 3 dari awal. Buatkan file-file berikut:

1. `src/main.js`
   - Setup Vue app dengan Pinia dan Router
   - Import global CSS variables

2. `src/assets/main.css`
   - Semua CSS variables dari design system (--bg, --accent, --glass-bg, dll)
   - Import font Inter + JetBrains Mono dari Google Fonts
   - Reset CSS dasar
   - Body background: var(--bg), grid lines background::before
   - Scrollbar custom (tipis, warna --border)
   - Class utility: .text-green, .text-red, .text-mono, .tabular-nums

3. `src/router/index.js`
   - Routing lengkap semua 7 halaman dengan lazy loading

4. `src/api/index.js`
   - Axios instance dengan baseURL dari import.meta.env.VITE_API_BASE_URL
   - Timeout 15000ms
   - Response interceptor: unwrap data.data, throw jika status='error'
   - Error interceptor: pesan friendly untuk network error/timeout
   - Export semua functions: getPortfolio, savePortfolio, getMarket,
     getReport, getTransactions, addTransaction, runPipeline,
     getGoldHistory, getWatchlist, saveWatchlist, validateTicker

5. `src/utils/formatters.js`
   - formatRupiah(n), formatJuta(n), formatPct(n)
   - formatGram(n), formatLot(n), formatUnit(n)
   - colorClass(n), arrowIcon(n)
   - formatDateTime(iso)

6. `src/utils/calculator.js`
   - calcPL(modal, nilai) → { pl, pl_pct }
   - calcAlokasi(emas, saham, reksa) → { emas_pct, saham_pct, reksa_pct }
   - suggestLot(totalAset, harga) → number
   - generateSparklineData(changePct, points=7) → number[]

7. `.env.local` dan `.env.production`
   - VITE_API_BASE_URL=http://192.168.192.81:4500/api

8. `vite.config.js`
   - Plugin vue
   - Build: code splitting, no sourcemap production

9. `deploy.sh`
   - npm run build → cek success → git add -A → commit timestamp → push

Gunakan design system dari PROJECT_CONTEXT.md.
JANGAN Firebase JS SDK. Semua data via axios ke Flask API.
```

---

## 🏪 PROMPT 02 — PINIA STORES

```
@PROJECT_CONTEXT.md

Buatkan semua 4 Pinia stores. Setiap store harus:
- Gunakan defineStore dengan Composition API style (setup stores)
- Semua action pakai try/catch, error simpan ke state
- Tidak ada fetch langsung di component — harus via store

1. `src/stores/market.js`
   State: market(null), lastSync('--'), loading(false), error(null), goldHistory([])
   Actions:
   - fetchMarket() → GET /api/market, update lastSync dari fetched_at
   - fetchGoldHistory() → GET /api/gold-history
   Getters:
   - goldPrice → market.emas.price
   - stockList → array dari market.saham.stocks
   - goldSparklineData → array harga dari goldHistory
   - goldChangePct → perubahan harga emas hari ini
   - valasRates → market?.valas?.rates ?? {}

2. `src/stores/portfolio.js`
   State: portfolio(null), originalPortfolio(null), hasChanges(false),
          loading(false), saving(false), error(null)
   Actions:
   - fetchPortfolio() → GET /api/portfolio
   - savePortfolio(data) → POST /api/portfolio, reset hasChanges
   - markChanged() → set hasChanges = true
   - resetChanges() → set hasChanges = false
   Getters:
   - totalModal, allItemsCount, sahamList, emasList, reksaList
   - valasList → portfolio?.valas ?? []

3. `src/stores/report.js`
   State: report(null), loading(false), running(false), error(null)
   Actions:
   - fetchReport() → GET /api/report
   - runPipeline() → POST /api/run (set running=true saat proses)
   Getters:
   - signals → report.signals || []
   - summary → report.summary || {}
   - allokasi → report.alokasi || {}
   - criticalSignals → signals filter priority==='critical'
   - highPrioritySignals → signals filter critical/high
   - signalCount → signals.length
   - valasSummary → report?.valas?.summary ?? { total_modal:0, total_nilai:0, total_pl:0, total_pl_pct:0 }
   - valasItems   → report?.valas?.items ?? []

4. `src/stores/transactions.js`
   State: transactions([]), loading(false), error(null)
   Actions:
   - fetchTransactions() → GET /api/transactions
   - addTransaction(data) → POST /api/transactions, unshift ke local state

Import api functions dari src/api/index.js.
```

---

## 🎨 PROMPT 03 — APP LAYOUT & SIDEBAR

```
@PROJECT_CONTEXT.md

Buatkan layout utama dengan sidebar glassmorphism.

1. `src/App.vue`
   - Layout flex: AppSidebar + router-view (main content)
   - Tambahkan ToastNotif global
   - Provide/inject untuk toast function

2. `src/components/layout/AppSidebar.vue`
   Spesifikasi detail:
   - Width: 220px, glassmorphism: background var(--glass-bg), backdrop-filter var(--glass-blur)
   - Logo area: tag "// v1.0.0" monospace hijau kecil, nama "Omni-Invest Sentinel" bold
   - Nav sections dengan label: "Monitor", "Roles", "System"
   - Nav items: Dashboard(⬡), Portfolio(◈), Alerts(◎)+badge sinyal,
                Scavenger(◐), Analyst(◑), Transaksi(⊞), Settings(⚙), System(◻)
   - Active state: border-left 2px var(--accent), background rgba(0,229,160,0.06)
   - Footer: dot animasi pulse hijau "STB ONLINE" + clock WIB real-time (update tiap detik)
   - Mobile: collapse jadi bottom navigation bar di < 768px

3. `src/components/layout/AppTopbar.vue`
   - Props: title, subtitle
   - Slot: #actions (untuk tombol kanan)
   - Subtitle style: font-mono, --text3, "// ..." format
   - Timestamp last sync dari useMarketStore

4. `src/components/ui/ToastNotif.vue`
   - Position: fixed bottom-right
   - Variants: success(hijau), error(merah), warning(kuning), info(biru)
   - Auto dismiss 3 detik
   - Composable: useToast() → { showToast(msg, type) }

5. `src/components/ui/LoadingSpinner.vue`
   - Spinner border-top var(--accent)
   - Prop: size('sm'|'md'|'lg'), fullpage(Boolean)

Pastikan sidebar tidak overlap main content.
```

---

## 🏠 PROMPT 04 — UI PRIMITIVES

```
@PROJECT_CONTEXT.md

Buatkan komponen UI primitif yang dipakai di semua halaman.

1. `src/components/ui/StatCard.vue`
   Tampilan:
   - Background var(--bg3), border var(--border), border-radius 10px
   - Border-left 3px sesuai variant (accent=hijau, danger=merah, warn=kuning, blue=biru, default=none)
   - label: font-mono, 9px, --text3, letter-spacing 2px, uppercase
   - prefix + value: font-mono, 28px, bold, sejajar
   - change: font-mono 11px, warna sesuai isPositive
   - Subtle glow effect pada border sesuai variant
   Props: label, value, prefix, change, changeLabel, isPositive, variant

2. `src/components/ui/SignalBadge.vue`
   - Styling sesuai design system: BUY/AVG_DOWN/SELL/HOLD/DCA/STOPLOSS
   - Setiap badge punya box-shadow glow tipis
   - STOPLOSS punya animasi pulse-danger
   - Font: font-mono, 10px, letter-spacing 1px
   - Tambahkan SELL_PARTIAL dan DATA_ERROR (lihat Prompt 20)
   Props: signal (String)

3. `src/components/ui/RoleBadge.vue`
   - Variants: scavenger(biru), analyst(hijau), messenger(oranye), auditor(kuning)
   Props: role (String)

4. `src/components/charts/PriceSparkline.vue`
   - SVG polyline tanpa axis, tanpa label, tanpa grid
   - Width 60px, Height 24px (customizable via props)
   - Warna line: --green jika changePct >= 0, --red jika negatif
   - Line width: 1.5px, smooth curves (bezier)
   - Gunakan generateSparklineData() dari calculator.js
   Props: changePct(Number), data(Array, optional), width(60), height(24)

5. `src/components/charts/AllocationChart.vue`
   - Progress bars dengan gradient
   - Emas: gradient #ffd93d → #ff9f43
   - Saham: gradient #0084ff → #00e5a0
   - Reksa: gradient #a29bfe → #6c5ce7
   - Animasi transition width 0.8s ease-out
   - Tampilkan ⚠️ jika aktual > target
   Props: aktual(Object), target(Object)

Semua komponen gunakan CSS variables, tidak ada hardcode warna.
```

---

## 🏠 PROMPT 05 — DASHBOARD VIEW

```
@PROJECT_CONTEXT.md

Buatkan `src/views/DashboardView.vue` — halaman utama command center.

Import stores: useReportStore, useMarketStore
Auto-fetch saat mounted. Auto-refresh setiap 60 detik.

Layout dari atas ke bawah:

1. SIGNAL BANNER (full width)
   - criticalSignals.length > 0 → banner merah dengan animasi pulse border
   - highPrioritySignals.length > 0 → banner oranye
   - Tidak ada sinyal → banner hijau "✅ Semua posisi aman"
   - Tampilkan sinyal pertama + tombol "Lihat Alerts →"

2. GRID 4 KOLOM — StatCard
   - Total Aset: summary.total_nilai dalam Juta (variant=accent)
   - Floating P&L: summary.total_pl + pct (variant berdasarkan positif/negatif)
   - Sinyal Aktif: signals.length (variant=danger jika > 0)
   - Alokasi Emas: allokasi.aktual.emas% (variant=warn jika > target)

3. GRID 2-1 (2/3 + 1/3)
   Kiri — AllocationChart component:
   - 3 progress bar Emas/Saham/Reksa (aktual vs target)
   - Rekomendasi rebalance di bawah:
     * Data dari allokasi.rekomendasi = array object {action, asset, actual, target}
     * BUKAN array string — jangan akses rec sebagai string
     * Template: <span :class="rec.action === 'TAMBAH' ? 'clr-green' : 'clr-orange'">{{ rec.action }}</span>
     * {{ (rec.actual ?? 0).toFixed(1) }}% → {{ rec.target }}%

   Kanan — Live Harga Pasar:
   - Baris emas: icon + harga + status badge
   - Per saham: kode + harga + change% + PriceSparkline
   - Sub-section kurs valas (tampil jika valasRates tidak kosong):
     * Label "// KURS VALAS" (font-mono, 9px, --text3)
     * Per baris: flag + CODE/IDR + harga + change_pct (▲/▼ warna)

4. WORKFLOW PIPELINE VISUALIZATION
   4 node: Scavenger → Analyst → Messenger → Auditor
   - Setiap node: icon besar, role badge, label, deskripsi singkat, status timestamp
   - Garis koneksi antar node (gradient biru→hijau)
   - Node terakhir (Auditor): highlight "← Kamu di sini"
   - Loading skeleton saat fetch pertama

Gunakan AppTopbar dengan slot action: tombol "⟳ Refresh" + "+ Transaksi".
```

---

## 📊 PROMPT 06 — PORTFOLIO VIEW

```
@PROJECT_CONTEXT.md

Buatkan `src/views/PortfolioView.vue`.

Import: useReportStore
Fetch saat mounted.

Layout:

1. 4 StatCard: Total Modal, Nilai Pasar, Total P&L (+variant), Jumlah Aset

2. Section EMAS
   Header: "🥇 Emas" + RoleBadge analyst "HOLD"
   Tabel columns: Nama Aset | Qty (gram) | Avg Beli | Harga Pasar | Nilai Pasar | P&L (Rp+%) | Signal
   - Semua angka: font-mono, tabular-nums
   - P&L: warna --green atau --red
   - Signal: komponen SignalBadge

3. Section SAHAM
   Header: "📈 Saham" + badge jumlah BUY/AVG_DOWN signals
   Tabel columns: Emiten (kode+nama) | Lot | Avg Buy | Harga Pasar | S/R | Nilai | P&L | Signal
   - Harga pasar: tampilkan arrow + changePct dengan warna
   - S/R: format "S: Rp5.800 | R: Rp6.500" kecil di bawah harga
   - Row background: rgba(255,71,87,0.04) untuk AVG_DOWN, rgba(0,229,160,0.03) untuk SELL

4. Section REKSA DANA
   Header: "🏦 Reksa Dana" + badge "DCA Rutin"
   Tabel columns: Produk | Unit | Avg NAB | NAB Saat Ini | Nilai | P&L | Signal
   - NAB Saat Ini diambil dari item.current_nab (sudah ada di report)
   - P&L sudah dihitung di backend, langsung tampilkan item.pl dan item.pl_pct

5. Section VALAS (tambahkan setelah reksa dana)
   Import dan gunakan komponen ValasSection:
   <ValasSection :items="valasItems" :summary="valasSummary" />
   - valasItems   = computed(() => reportStore.valasItems)
   - valasSummary = computed(() => reportStore.valasSummary)
```

---

## 🚨 PROMPT 07 — ALERTS VIEW

```
@PROJECT_CONTEXT.md

Buatkan `src/views/AlertsView.vue`.

Import: useReportStore, useMarketStore
Auto-refresh 60 detik.

Layout:

1. 3 StatCard: Prioritas Tinggi (merah), Rebalance (kuning), Total Sinyal

2. Empty state jika signals.length === 0

3. List sinyal (urut: critical → high → medium → normal)
   Per sinyal card:
   - Border kiri sesuai priority
   - Tombol "💹 Eksekusi" untuk BUY/AVG_DOWN → buka TransactionForm modal pre-filled

4. Tombol refresh di topbar

Buatkan juga `src/components/transactions/TransactionForm.vue` (modal):
Props: prefill(Object) → { aset, aksi, harga, qty_saran }
- Fields: Jenis Aset, Aksi, Kode/Nama, Qty, Harga
- Preview total = qty × harga (reactive)
- Submit → addTransaction() dari store
```

---

## ⚙️ PROMPT 08 — SETTINGS VIEW (CRUD PORTFOLIO)

```
@PROJECT_CONTEXT.md

Buatkan `src/views/SettingsView.vue` — halaman CRUD portofolio.

Import: usePortfolioStore

Layout:

1. Tab navigation: 🥇 Emas | 📈 Saham | 🏦 Reksa Dana | 💱 Valas | ⚖️ Target Alokasi

2. Per tab aset (Emas/Saham/Reksa):
   - Tombol "+ Tambah [Aset]"
   - List aset cards dengan detail fields
   - Per card: tombol ✏️ Edit + 🗑 Hapus

3. Tab Valas: gunakan ValasFormModal untuk add/edit

4. Tab Target Alokasi:
   - Input number per kategori (Emas/Saham/Reksa)
   - Total harus = 100%
   - Key di portfolio: target_allocation.reksa (bukan reksadana!)

5. Save Bar (sticky bottom, muncul jika hasChanges)

PENTING — localPortfolio computed yang dikirim ke PLPreviewModal
HARUS menyertakan semua key termasuk valas:
const localPortfolio = computed(() => ({
  emas:              localEmas.value,
  saham:             localSaham.value,
  reksadana:         localReksa.value,
  target_allocation: localTarget.value,
  valas:             portfolioStore.portfolio?.valas ?? [],  // ← WAJIB ADA
}))
Jika valas tidak disertakan, data valas akan terhapus saat save!

Buatkan `src/components/portfolio/AssetFormModal.vue`:
- Form Reksa: id, nama, qty_unit, avg_buy_nab, rd_code, catatan
  * rd_code: input text, auto uppercase, placeholder "RD424"
  * Hint: "Dari URL bibit.id/reksadana/RD424/nama-reksa"
  * rd_code disimpan ke Firestore dan dipakai pipeline untuk auto-fetch NAB
- Form Saham: id, nama, ticker, qty_lot, avg_buy_price, support, resistance, stop_loss, catatan
- Form Emas: id, nama, qty_gram, avg_buy_price, catatan

Buatkan `src/components/portfolio/PLPreviewModal.vue`:
- Ringkasan perubahan + tombol konfirmasi simpan
```

---

## 🔍 PROMPT 09 — SCAVENGER VIEW

```
@PROJECT_CONTEXT.md

Buatkan `src/views/ScavengerView.vue`.

Import: useMarketStore, useReportStore

Layout:

1. Topbar action: tombol "⟳ Manual Fetch" → runPipeline()

2. 3 StatCard: Last Fetch (timestamp), Data Sources (3), Schedule (09-16 WIB)

3. Card "Data Sources & Status":
   - Harga Emas: logammulia.com | OK | Rp{goldPrice}/g
   - Harga Saham: Yahoo Finance | OK/PARTIAL
   - NAB Reksa Dana: Bibit API (simulations) | OK | auto-update tiap pipeline
     * Endpoint: api.bibit.id/products/{RD_CODE}/simulations?range=120
     * NAB = elemen terakhir array data

4. Card "Raw JSON Output":
   - JSON syntax highlighting
   - Max height 400px dengan scroll
```

---

## 📈 PROMPT 10 — ANALYST VIEW

```
@PROJECT_CONTEXT.md

Buatkan `src/views/AnalystView.vue`.

Import: useReportStore

Layout:

1. 3 StatCard: Rules Aktif, Sinyal Terpicu, Engine Status

2. Grid 2 kolom:
   Kiri — "Aturan S/R & Status" per saham
   Kanan — "ROI Proyek" dengan highlight box projected saving
```

---

## 💳 PROMPT 11 — TRANSACTIONS VIEW

```
@PROJECT_CONTEXT.md

Buatkan `src/views/TransactionsView.vue`.

Import: useTransactionsStore, useReportStore
Fetch transactions saat mounted.

Layout:
1. Topbar action: tombol "+ Transaksi Baru"
2. Tabel: Tanggal | Aset | Aksi | Qty | Harga | Total | Catatan
3. Empty state jika belum ada transaksi
```

---

## 🔧 PROMPT 12 — FIX & DEBUGGING

```
@PROJECT_CONTEXT.md

Saya mengalami masalah berikut:

[DESKRIPSIKAN MASALAH]

File: [NAMA FILE]
Error: [PASTE ERROR MESSAGE]
Langkah yang sudah dicoba: [JIKA ADA]

Tolong:
1. Identifikasi root cause
2. Berikan solusi sesuai arsitektur project (Vue 3 + Pinia + Axios → Flask API)
3. Pastikan fix tidak melanggar aturan:
   - Tidak ada Firebase JS SDK
   - Gunakan CSS variables
   - <script setup> syntax
   - Font JetBrains Mono untuk angka
   - alokasi.rekomendasi adalah array object {action, asset, actual, target}
   - target_allocation pakai key "reksa" bukan "reksadana"
   - localPortfolio di SettingsView HARUS include key valas
```

---

## 📱 PROMPT 13 — RESPONSIVE MOBILE

```
@PROJECT_CONTEXT.md

Update komponen berikut agar responsive di mobile (< 768px):
[SEBUTKAN KOMPONEN]

Aturan mobile:
- Sidebar → bottom navigation bar (5 item utama: Dashboard, Portfolio, Alerts, Settings, More)
- Grid 4 kolom → 2 kolom
- Grid 2/3 + 1/3 → 1 kolom (stacked)
- Tabel saham/reksa → card layout
- Touch target minimum 44px height
- AppSidebar hide di mobile, ganti dengan AppBottomNav
```

---

## 🚢 PROMPT 14 — DEPLOY

```
@PROJECT_CONTEXT.md

Build dan deploy dashboard ke STB:

1. `deploy.sh` (laptop):
   - npm run build → cek exit code
   - git add -A → commit "deploy: $(date)" → push origin main

2. STB apply update:
   /home/sidrive/deploy.sh → git pull → pm2 restart omni-dashboard

3. Pastikan dist/ tidak di-ignore di .gitignore
```

---

## 🏦 PROMPT 15 — UPDATE REKSA DANA (FIELD rd_code)

```
@PROJECT_CONTEXT.md

Update `src/components/portfolio/AssetFormModal.vue` untuk menambahkan
field rd_code pada form reksa dana.

Konteks:
- rd_code dipakai pipeline Python untuk auto-fetch NAB dari Bibit
- Format: "RD424" — dari URL bibit.id/reksadana/RD424/nama-reksa
- Harus disimpan ke Firestore bersama data portfolio lainnya

Perubahan yang dibutuhkan:

1. emptyForm() — tambah field:
   rd_code: ''

2. submit() block reksa — tambah ke data object:
   rd_code: form.rd_code?.trim().toUpperCase() || ''

3. Template — tambah input field setelah "NAB Saat Ini":
   - Label: "Kode Bibit" dengan hint "(untuk auto-fetch NAB)"
   - Input: v-model="form.rd_code", auto uppercase, placeholder "RD424"
   - Hint text: "Dari URL bibit.id/reksadana/RD424/nama-reksa"

Jangan ubah field lain, hanya tambahkan rd_code.
```

---

## 💱 PROMPT 15.1 — VALAS: STORES UPDATE

```
@PROJECT_CONTEXT.md

Update 3 Pinia stores yang sudah ada untuk support fitur Valas.
JANGAN timpa seluruh file — hanya tambahkan getter baru di masing-masing store.

1. `src/stores/report.js`
   Tambahkan 2 getter baru di bagian getters (setelah getter yang sudah ada):
   - valasSummary → report?.valas?.summary ?? { total_modal:0, total_nilai:0, total_pl:0, total_pl_pct:0 }
   - valasItems   → report?.valas?.items   ?? []

2. `src/stores/market.js`
   Tambahkan 1 getter baru:
   - valasRates → market?.valas?.rates ?? {}
     Format rates: { USD: { rate, change_pct, status, symbol }, SGD: {...}, ... }

3. `src/stores/portfolio.js`
   Tambahkan 1 getter baru:
   - valasList → portfolio?.valas ?? []

Semua getter menggunakan optional chaining (??) agar tidak error
jika data belum ada (portfolio lama belum punya key valas).
```

---

## 💱 PROMPT 16 — VALAS: KOMPONEN BARU

```
@PROJECT_CONTEXT.md

Buatkan 2 file komponen baru untuk fitur Valas.

─────────────────────────────────────────────────────
1. `src/components/portfolio/ValasSection.vue`
─────────────────────────────────────────────────────
Komponen tabel posisi valas, ditampilkan di PortfolioView.

Props:
- items   : Array  — dari reportStore.valasItems
- summary : Object — dari reportStore.valasSummary

Tampilan:
- Header section: "💱 Valas" + badge jumlah posisi + total P&L di kanan
- Empty state jika items kosong: icon 💱, teks "Belum ada posisi valas",
  sub "Tambahkan via Settings → Valas"
- Tabel dengan kolom:
  Mata Uang | Qty Unit | Avg Beli | Kurs Saat Ini | Change | Nilai (IDR) | P&L | Signal

Detail kolom:
- Mata Uang: flag emoji (🇺🇸🇸🇬🇪🇺🇯🇵) + kode bold + nama kecil di bawahnya
- Qty Unit: font-mono, JPY tanpa desimal, lainnya 2 desimal + simbol ($, S$, €, ¥)
- Avg Beli: font-mono, --text3 (warna redup)
- Kurs Saat Ini: font-mono
- Change: font-mono, --green jika >=0, --red jika negatif, prefix ▲/▼
- Nilai IDR: font-mono, formatRupiah
- P&L: 2 baris — nilai Rupiah (atas) + persentase kecil (bawah), warna --green/--red
- Signal: komponen SignalBadge

Footer tabel: row "Total Valas" dengan total nilai + total P&L
Responsive: sembunyikan kolom "Avg Beli" di mobile < 768px
Semua angka: font-variant-numeric: tabular-nums

─────────────────────────────────────────────────────
2. `src/components/portfolio/ValasFormModal.vue`
─────────────────────────────────────────────────────
Modal form untuk tambah/edit posisi valas, dipakai di SettingsView.

Props:
- editItem   : Object|null — null = mode tambah, Object = mode edit
- valasRates : Object      — dari marketStore.valasRates (untuk live preview kurs)

Emits: close, save(item)

Field form:
- Mata Uang (select, disabled saat edit):
  opsi: USD 🇺🇸, SGD 🇸🇬, EUR 🇪🇺, JPY 🇯🇵
- Label / Nama (text input, placeholder "cth: USD Tabungan BCA")
- Jumlah / qty_unit (number, step 0.01 atau 100 untuk JPY)
- Kurs Rata-rata Beli / avg_buy_rate (number, step 1)
  hint di bawah: tampilkan kurs saat ini dari valasRates sebagai referensi
- Catatan (text input, opsional)

Live rate banner (tampil jika valasRates tersedia):
- Background biru subtle rgba(0,132,255,0.06)
- Tampilkan: flag + "CODE/IDR" + harga saat ini (bold biru) + change_pct (▲/▼)

P&L Preview live (tampil jika qty dan avg_buy_rate sudah diisi):
- Modal = qty × avg_buy_rate
- Nilai = qty × kurs_saat_ini
- Est. P&L = Nilai - Modal (warna --green/--red)
- Update reactive saat input berubah

Validasi:
- code: required
- nama: required, tidak boleh kosong
- qty_unit: harus > 0
- avg_buy_rate: harus > 0
Tombol simpan disabled jika validasi gagal

Auto-generate id: "{code.toLowerCase()}_{4-digit-timestamp}" saat code berubah (mode tambah)

Gunakan <script setup> Composition API.
CSS variables semua, tidak ada hardcode warna.
```

---

## 💱 PROMPT 17 — VALAS: UPDATE PORTFOLIO VIEW

```
@PROJECT_CONTEXT.md

Update `src/views/PortfolioView.vue` — tambahkan section Valas.

Yang perlu ditambahkan (JANGAN timpa seluruh file):

1. Import baru di <script setup>:
   import ValasSection from '@/components/portfolio/ValasSection.vue'

2. Getter baru dari reportStore:
   const valasItems   = computed(() => reportStore.valasItems)
   const valasSummary = computed(() => reportStore.valasSummary)

3. Di <template>, tambahkan setelah section reksa dana (</section> terakhir):
   <ValasSection
     :items="valasItems"
     :summary="valasSummary"
   />

Pastikan tidak mengubah section Emas, Saham, Reksa yang sudah ada.
```

---

## 💱 PROMPT 18 — VALAS: UPDATE SETTINGS VIEW

```
@PROJECT_CONTEXT.md

Update `src/views/SettingsView.vue` — tambahkan tab Valas dengan CRUD lengkap.

Yang perlu ditambahkan (JANGAN timpa seluruh file):

1. Import baru di <script setup>:
   import ValasFormModal from '@/components/portfolio/ValasFormModal.vue'
   import { useMarketStore } from '@/stores/market'

2. State dan computed baru:
   const marketStore    = useMarketStore()
   const valasRates     = computed(() => marketStore.valasRates)
   const showValasModal = ref(false)
   const editValasItem  = ref(null)

3. Handler functions:
   - openAddValas()  → set editValasItem=null, showValasModal=true
   - openEditValas(item) → set editValasItem={...item}, showValasModal=true
   - deleteValas(id) → splice dari portfolioStore.portfolio.valas, markChanged()
   - handleValasSave(item):
     * cari index di portfolio.valas via item.id
     * jika ada → replace (edit), jika tidak → push (tambah baru)
     * markChanged()
     * showValasModal = false

4. PENTING — pastikan localPortfolio computed menyertakan valas:
   const localPortfolio = computed(() => ({
     emas:              localEmas.value,
     saham:             localSaham.value,
     reksadana:         localReksa.value,
     target_allocation: localTarget.value,
     valas:             portfolioStore.portfolio?.valas ?? [],  // ← WAJIB
   }))

5. Di <template> — tab navigation, tambahkan tombol tab baru:
   <button class="tab-btn" :class="{ active: activeTab === 'valas' }" @click="activeTab = 'valas'">
     💱 Valas
   </button>

6. Di <template> — panel tab Valas, tambahkan setelah panel reksa:
   (lihat implementasi lengkap di SettingsView yang sudah ada)

7. Di <template> — tambahkan modal di paling bawah sebelum </template>:
   <ValasFormModal
     v-if="showValasModal"
     :edit-item="editValasItem"
     :valas-rates="valasRates"
     @close="showValasModal = false"
     @save="handleValasSave"
   />

Helper function yang perlu ditambahkan di <script setup>:
const FLAG_MAP = { USD: '🇺🇸', SGD: '🇸🇬', EUR: '🇪🇺', JPY: '🇯🇵' }
const flagEmoji = (code) => FLAG_MAP[code] ?? '🏳️'

Jangan ubah tab Emas, Saham, Reksa Dana, dan Target Alokasi yang sudah ada.
```

---

## 💱 PROMPT 19 — VALAS: UPDATE DASHBOARD VIEW

```
@PROJECT_CONTEXT.md

Update `src/views/DashboardView.vue` — tambahkan StatCard Valas dan
kurs valas di panel Live Harga Pasar.

Yang perlu ditambahkan (JANGAN timpa seluruh file):

1. Getter baru dari store:
   const valasSummary = computed(() => reportStore.valasSummary)
   const valasRates   = computed(() => marketStore.valasRates)

2. Di grid StatCard (setelah StatCard reksa atau alokasi emas):
   Tambahkan StatCard valas — hanya tampil jika ada posisi (total_nilai > 0):

   <StatCard
     v-if="valasSummary.total_nilai > 0"
     label="VALAS"
     :value="formatJuta(valasSummary.total_nilai)"
     prefix="Rp"
     :change="formatPct(valasSummary.total_pl_pct)"
     change-label="floating"
     :is-positive="valasSummary.total_pl >= 0"
     variant="blue"
   />

3. Di panel "Live Harga Pasar" (kanan, setelah list saham):
   Tambahkan sub-section kurs valas:

   <div v-if="Object.keys(valasRates).length" class="market-subsection">
     <div class="subsection-label">// KURS VALAS</div>
     <div v-for="(data, code) in valasRates" :key="code" class="valas-rate-row">
       <span class="rate-currency mono">{{ flagEmoji(code) }} {{ code }}/IDR</span>
       <span class="rate-value mono">{{ formatRupiah(data.rate) }}</span>
       <span class="rate-change mono" :class="data.change_pct >= 0 ? 'text-green' : 'text-red'">
         {{ data.change_pct >= 0 ? '▲' : '▼' }}{{ Math.abs(data.change_pct).toFixed(2) }}%
       </span>
     </div>
   </div>

Jangan ubah bagian lain dari DashboardView.
```

---

## 💱 PROMPT 20 — VALAS: SIGNAL BADGE UPDATE

```
@PROJECT_CONTEXT.md

Update `src/components/ui/SignalBadge.vue` — tambahkan styling
untuk 2 signal baru yang dihasilkan analyst valas:

Signal baru yang perlu ditambahkan:
- SELL_PARTIAL → styling mirip SELL tapi lebih redup
  background: rgba(255,71,87,0.08)
  color: #ff4757
  border: 1px solid rgba(255,71,87,0.3)
  box-shadow: 0 0 6px rgba(255,71,87,0.15)

- DATA_ERROR → styling warning oranye
  background: rgba(255,107,53,0.1)
  color: #ff6b35
  border: 1px solid rgba(255,107,53,0.35)

Tambahkan hanya 2 class baru ini ke dalam <style> yang sudah ada.
Jangan ubah styling signal lainnya (BUY, SELL, HOLD, DCA, STOPLOSS, AVG_DOWN).
```

---

## 🐛 PROMPT 21 — FIX: AVG BUY PRICE EMAS (HARGA PER GRAM vs TOTAL MODAL)

```
@PROJECT_CONTEXT.md

PENTING — Perbedaan interpretasi avg_buy_price untuk emas:

Di Omni-Invest, avg_buy_price emas diinterpretasikan sebagai HARGA PER GRAM.
Kalkulasi modal: modal = qty_gram × avg_buy_price

Jika user membeli emas di platform seperti Bareksa/Treasury yang menampilkan
"Nilai Semula" (total modal), user harus mengonversinya dulu:

avg_buy_price (per gram) = total_modal / qty_gram
Contoh: total_modal Rp3.000.000 / 1.5848 gram = Rp1.893.143/gram

Tambahkan hint text di form input avg_buy_price emas di AssetFormModal.vue:
- Di bawah input avg_buy_price, tambahkan hint:
  "Harga per gram. Jika tahu total modal: bagi total modal ÷ jumlah gram"
- Tambahkan helper input opsional "Hitung dari Total Modal":
  * Input: total_modal (number)
  * Otomatis isi avg_buy_price = total_modal / qty_gram saat diisi
  * Label: "Atau hitung dari total modal (opsional)"
  * Hanya tampil jika qty_gram sudah diisi

Ini mencegah user salah input total modal sebagai harga per gram.
```

---

## 🐛 PROMPT 22 — FIX: PARTIAL SAVE PORTFOLIO (DATA HILANG SAAT SIMPAN)

```
@PROJECT_CONTEXT.md

BUG KRITIS yang sudah pernah terjadi: data valas (atau aset lain) hilang
saat user menyimpan perubahan dari tab lain di SettingsView.

Root cause: localPortfolio computed tidak menyertakan semua key portfolio.

AUDIT CHECKLIST — pastikan hal berikut di SettingsView.vue:

1. localPortfolio computed HARUS menyertakan SEMUA key:
   const localPortfolio = computed(() => ({
     emas:              localEmas.value,
     saham:             localSaham.value,
     reksadana:         localReksa.value,
     target_allocation: localTarget.value,
     valas:             portfolioStore.portfolio?.valas ?? [],  // ← sering ketinggalan!
   }))

2. PLPreviewModal menerima prop :after="localPortfolio" — pastikan
   modal ini meneruskan SELURUH object ke savePortfolio(), bukan hanya
   field yang berubah.

3. Saat deleteValas() / handleValasSave() — pastikan markChanged() dipanggil
   agar save bar muncul dan user tahu ada perubahan pending.

4. Saat resetAll() — pastikan populateLocal() juga me-reset state valas
   dari portfolioStore.portfolio.valas.

Jika ditemukan key yang hilang dari localPortfolio, tambahkan segera.
Test: edit emas → simpan → cek apakah valas masih ada di Firestore.
```

---

_Urutan eksekusi untuk fitur Valas:_
_Prompt 15.1 → Prompt 16 → Prompt 17 → Prompt 18 → Prompt 19 → Prompt 20_
_Setelah selesai semua: npm run build && ./deploy.sh_

---

## 💡 TIPS WORKFLOW CURSOR + CLAUDE

### Urutan Development:

```
Prompt 01 → Fondasi
Prompt 02 → Stores
Prompt 03 → Layout
Prompt 04 → UI Primitives
Prompt 05 → Dashboard ← test pertama
Prompt 06 → Portfolio
Prompt 07 → Alerts
Prompt 08 → Settings (CRUD)
Prompt 09 → Scavenger
Prompt 10 → Analyst
Prompt 11 → Transactions
Prompt 13 → Responsive Mobile
Prompt 14 → Deploy
```

### Pattern Komponen Baru:

```
@PROJECT_CONTEXT.md

Buatkan [NAMA_KOMPONEN].vue dengan spesifikasi:
- Props: [list props]
- Data dari store: [nama store]
- Visual: [deskripsi tampilan]
- Behavior: [interaksi]

Gunakan CSS variables, JetBrains Mono untuk angka,
<script setup>, font-variant-numeric: tabular-nums pada tabel.
```

### Fix Warna Hardcode:

```
Perbaiki komponen ini — ganti semua hardcode warna
dengan CSS variables dari design system PROJECT_CONTEXT.md.
Contoh: #00e5a0 → var(--accent), #ff4757 → var(--danger)
```

### Fix Error API:

```
@PROJECT_CONTEXT.md

API call gagal: [ERROR]
Endpoint: [METHOD URL]
Store: [NAMA STORE]

Cek: baseURL dari VITE_API_BASE_URL, response unwrapping,
try/catch di store, struktur response di PROJECT_CONTEXT.md.
```

### Fix Data Reksa Dana:

```
@PROJECT_CONTEXT.md

Masalah data reksa dana:
- current_nab dibaca dari report.reksadana.items[].current_nab (bukan nab)
- P&L sudah dihitung backend: item.pl, item.pl_pct
- alokasi.rekomendasi = array object {action, asset, actual, target}
- target_allocation.reksa (bukan reksadana)
- rd_code di portfolio dipakai pipeline untuk auto-fetch NAB dari Bibit
```

### Fix Data Emas (avg_buy_price):

```
@PROJECT_CONTEXT.md

avg_buy_price emas = HARGA PER GRAM, bukan total modal.
Jika platform (Bareksa/Treasury) menampilkan total modal:
  avg_buy_price = total_modal / qty_gram
Contoh: Rp3.000.000 / 1.5848g = Rp1.893.143/g

Setelah update avg_buy_price, jalankan pipeline manual:
cd /home/sidrive/omni-invest && source venv/bin/activate && python3 main.py
P&L di PortfolioView diambil dari report (hasil pipeline), bukan real-time.
```

### Fix Data Hilang Saat Save:

```
@PROJECT_CONTEXT.md

Jika data aset (valas/emas/saham/reksa) hilang setelah save di Settings:
Root cause: localPortfolio computed di SettingsView tidak menyertakan
semua key saat dikirim ke PLPreviewModal → savePortfolio().

Cek dan pastikan localPortfolio = {
  emas, saham, reksadana, target_allocation, valas  ← semua harus ada
}
Lihat Prompt 22 untuk audit checklist lengkap.
```

---

_Selalu update PROJECT_CONTEXT.md jika ada perubahan arsitektur_
_Last updated: 2026-06-05_
