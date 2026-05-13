# CLAUDE PROMPTS — OMNI-INVEST DASHBOARD
> Kumpulan prompt siap pakai di Cursor editor dengan Claude extension
> Selalu sertakan PROJECT_CONTEXT.md sebagai context sebelum menjalankan prompt ini

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
     getReport, getTransactions, addTransaction, runPipeline

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
   State: market(null), lastSync('--'), loading(false), error(null)
   Action: fetchMarket() → GET /api/market, update lastSync dari fetched_at
   Getters: goldPrice, stockList (array dari market.saham.stocks)

2. `src/stores/portfolio.js`
   State: portfolio(null), originalPortfolio(null), hasChanges(false),
          loading(false), saving(false), error(null)
   Actions:
   - fetchPortfolio() → GET /api/portfolio
   - savePortfolio(data) → POST /api/portfolio, reset hasChanges
   - markChanged() → set hasChanges = true
   Getters: totalModal, allItemsCount, sahamList, emasList, reksaList

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
   - Analyst insight di bawah (allokasi.rekomendasi)

   Kanan — Live Harga Pasar:
   - Baris emas: icon + harga + status badge
   - Per saham: kode + harga + change% + PriceSparkline

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
   - Tooltip pada SignalBadge: tampilkan signal_reason

4. Section REKSA DANA
   Header: "🏦 Reksa Dana" + badge "DCA Rutin"
   Tabel columns: Produk | Unit | Avg NAB | NAB Saat Ini | Nilai | P&L | Signal

Buatkan `src/components/portfolio/AssetTable.vue` sebagai wrapper tabel yang reusable
dengan props: title, badge, columns, data, type('emas'|'saham'|'reksa').
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

2. Empty state jika signals.length === 0:
   - Icon besar ✅, heading "Semua Posisi Aman"
   - Subtext: "Analyst akan kirim notifikasi bila ada pergerakan"

3. List sinyal (urut: critical → high → medium → normal)
   Per sinyal card:
   - Border kiri: critical=var(--danger), high=var(--orange), medium=var(--warn)
   - Icon sesuai type: BUY=💚, AVG_DOWN=📉, SELL=🔴, STOPLOSS=🚨, REBALANCE=⚖️
   - Title: "[TYPE] — [ASET]" bold
   - Body: alasan lengkap, font-mono kecil
   - Meta: priority badge + timestamp WIB
   - Tombol "💹 Eksekusi" untuk BUY/AVG_DOWN:
     * Buka TransactionForm modal dengan data pre-filled
     * Tampilkan saran lot menggunakan suggestLot() dari calculator.js
     * Harga pre-filled dari market_price saham tersebut

4. Tombol refresh di topbar

Buatkan juga `src/components/transactions/TransactionForm.vue` (modal):
Props: prefill(Object) → { aset, aksi, harga, qty_saran }
- Jika prefill ada → tampilkan section "Saran dari Analyst" dengan saran lot
- Fields: Jenis Aset, Aksi, Kode/Nama, Qty (satuan dinamis), Harga
- Preview total = qty × harga (reactive, real-time)
- Submit → addTransaction() dari store
```

---

## ⚙️ PROMPT 08 — SETTINGS VIEW (CRUD PORTFOLIO)

```
@PROJECT_CONTEXT.md

Buatkan `src/views/SettingsView.vue` — halaman CRUD portofolio.

Import: usePortfolioStore

Layout:

1. Tab navigation: 🥇 Emas | 📈 Saham | 🏦 Reksa Dana | ⚖️ Target Alokasi

2. Per tab aset (Emas/Saham/Reksa):
   - Tombol "+ Tambah [Aset]"
   - List aset cards dengan detail fields
   - Per card: tombol ✏️ Edit + 🗑 Hapus
   - Konfirmasi hapus via modal kecil

3. Tab Target Alokasi:
   - Input slider/number per kategori (Emas/Saham/Reksa)
   - Total harus = 100%, tampilkan warning jika tidak
   - Preview allocation bars real-time

4. Save Bar (sticky bottom, muncul jika hasChanges):
   "⚠️ Ada perubahan belum disimpan"
   Tombol [↩ Reset] [👁 Preview & Simpan →]

Buatkan `src/components/portfolio/AssetFormModal.vue`:
- Mode: tambah (editIndex=-1) atau edit (editIndex>=0)
- Form Emas: id, nama, qty_gram, avg_buy_price, catatan
- Form Saham: id, nama, ticker(auto dari id+'.JK'), qty_lot, avg_buy_price,
              support, resistance, stop_loss, catatan
- Form Reksa: id, nama, qty_unit, avg_buy_nab, catatan
- Validasi: id dan nama required, angka harus positif
- Auto uppercase untuk id saham

Buatkan `src/components/portfolio/PLPreviewModal.vue`:
- Ringkasan perubahan (ADD/EDIT/DELETE dengan badge warna)
- Tabel perbandingan: Sebelum → Sesudah
  * Total Modal, Jumlah Aset, per kategori
- Tombol "✅ Konfirmasi & Simpan" → savePortfolio()
- Loading state saat menyimpan

Gunakan usePortfolioStore() untuk semua operasi.
Panggil markChanged() setiap ada modifikasi data.
```

---

## 🔍 PROMPT 09 — SCAVENGER VIEW

```
@PROJECT_CONTEXT.md

Buatkan `src/views/ScavengerView.vue`.

Import: useMarketStore, useReportStore

Layout:

1. Topbar action: tombol "⟳ Manual Fetch" → runPipeline()
   Loading state + toast sukses/error setelah selesai

2. 3 StatCard: Last Fetch (timestamp), Data Sources (3), Schedule (09-16 WIB)

3. Card "Data Sources & Status":
   Setiap row: Nama | Source URL | Status Badge | Nilai Terakhir | Timestamp
   - Harga Emas: logammulia.com | OK | Rp{goldPrice}/g
   - Harga Saham: Yahoo Finance | OK/PARTIAL | list kode saham
   - NAB Reksa Dana: Manual | PENDING | "Update jam 16:30"
   Status badge: health-ok(hijau) / health-warn(kuning) / health-err(merah)

4. Card "Raw JSON Output":
   - Tampilkan market data dari useMarketStore sebagai JSON
   - Syntax highlighting sederhana:
     * Key string: warna var(--blue)
     * Value string: warna var(--warn)
     * Value number: warna var(--green)
     * Null/boolean: warna var(--orange)
   - Implementasi highlighting via regex replace + span
   - Max height 400px dengan overflow-y scroll

Font-mono untuk semua data teknis.
```

---

## 📈 PROMPT 10 — ANALYST VIEW

```
@PROJECT_CONTEXT.md

Buatkan `src/views/AnalystView.vue`.

Import: useReportStore

Layout:

1. 3 StatCard: Rules Aktif, Sinyal Terpicu, Engine Status (AKTIF/hijau)

2. Grid 2 kolom:

   Kiri — "Aturan S/R & Status":
   Per saham dari report.saham.items:
   - Support: status TRIGGERED(merah)/APPROACHING(kuning)/AMAN(hijau)
   - Resistance: sama
   - Stop Loss: sama
   Format baris: "[BBCA Support Rp5.800] ← [Rp6.150] → [AMAN ✓]"

   Kanan — "ROI Proyek":
   List items:
   - 💰 Hemat langganan: +Rp75rb/bln
   - ⏱ Waktu tersimpan: ~4 jam/minggu
   - 📊 Keputusan data: 100%
   - 🚫 FOMO tercegah: {signals.length}× bulan ini
   
   Highlight box di bawah:
   Background rgba(0,229,160,0.05), border rgba(0,229,160,0.15):
   - Label: "PROJECTED ANNUAL SAVING" (monospace kecil)
   - Value: "Rp 900.000+" (besar, --accent)
   - Sub: "Belum termasuk profit optimization"

Hitung rulesCount = saham.items.length × 3 + 1 (alokasi rule).
```

---

## 💳 PROMPT 11 — TRANSACTIONS VIEW

```
@PROJECT_CONTEXT.md

Buatkan `src/views/TransactionsView.vue`.

Import: useTransactionsStore, useReportStore (untuk summary total aset)
Fetch transactions saat mounted.

Layout:

1. Topbar action: tombol "+ Transaksi Baru" → buka modal

2. Tabel riwayat:
   Columns: Tanggal | Aset | Aksi | Qty | Harga | Total | Catatan
   - Tanggal: format "12 Mei 2026"
   - Aksi: SignalBadge style (BELI=hijau, JUAL=merah)
   - Total = qty × harga, format Rupiah
   - Semua angka: font-mono, tabular-nums

3. Empty state jika belum ada transaksi

Modal TransactionForm (reuse dari komponen yang sudah dibuat di Prompt 07).

Fetch ulang setelah berhasil tambah transaksi.
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
- Tabel saham → card layout (setiap row jadi card dengan semua info)
- StatCard value font-size lebih kecil tapi tetap terbaca
- Touch target minimum 44px height
- PriceSparkline tetap tampil (perkecil jika perlu)
- Dark theme dan CSS variables tetap sama
- AppSidebar hide di mobile, ganti dengan AppBottomNav
```

---

## 🚢 PROMPT 14 — DEPLOY PREPARATION

```
@PROJECT_CONTEXT.md

Persiapkan project untuk deployment:

1. Update `vite.config.js`:
   - Lazy loading per route (dynamic import)
   - Build output: dist/
   - No sourcemap production
   - Asset inline limit: 4096

2. `deploy.sh` (laptop):
   #!/bin/bash
   - Jalankan npm run build
   - Cek apakah build berhasil (exit code)
   - git add -A
   - git commit -m "deploy: $(date '+%Y-%m-%d %H:%M') WIB"
   - git push origin main
   - Echo instruksi untuk STB

3. Pastikan `.gitignore` tidak mengabaikan dist/
   - Tambahkan comment: "# dist/ sengaja TIDAK di-ignore (STB pull langsung)"

4. `index.html`:
   - Tambahkan loading screen minimal saat Vue belum mount
   - Background #0a0c10, text "Loading..." dengan font-mono --accent

5. README.md singkat:
   - Tech stack
   - Cara develop: npm run dev
   - Cara deploy: ./deploy.sh
   - Cara update STB: /home/sidrive/deploy.sh
```

---

## 💡 TIPS WORKFLOW CURSOR + CLAUDE

### Urutan Development yang Disarankan:
```
Prompt 01 → Fondasi (main, router, api, utils)
Prompt 02 → Stores (Pinia)
Prompt 03 → Layout (App, Sidebar, Topbar, Toast)
Prompt 04 → UI Primitives (StatCard, SignalBadge, Sparkline)
Prompt 05 → Dashboard View ← test pertama kali di browser
Prompt 06 → Portfolio View
Prompt 07 → Alerts View + TransactionForm
Prompt 08 → Settings View (CRUD)
Prompt 09 → Scavenger View
Prompt 10 → Analyst View
Prompt 11 → Transactions View
Prompt 13 → Responsive Mobile
Prompt 14 → Deploy
```

### Pattern untuk Setiap Komponen Baru:
```
@PROJECT_CONTEXT.md

Buatkan [NAMA_KOMPONEN].vue dengan spesifikasi:
- Props: [list props]
- Data dari store: [nama store]
- Visual: [deskripsi tampilan]
- Behavior: [interaksi]

Gunakan:
- CSS variables dari design system
- JetBrains Mono untuk semua angka
- <script setup> Composition API
- font-variant-numeric: tabular-nums pada kolom angka
```

### Jika Claude Generate Warna Hardcode:
```
Perbaiki komponen ini — ganti semua hardcode warna (#xxx atau rgb/rgba)
dengan CSS variables yang sesuai dari design system PROJECT_CONTEXT.md.
Contoh: #00e5a0 → var(--accent), #ff4757 → var(--danger)
```

### Jika Ada Error API:
```
@PROJECT_CONTEXT.md

API call gagal dengan error: [ERROR]
Endpoint: [METHOD] [URL]
Store: [NAMA STORE]

Cek apakah:
1. baseURL dari VITE_API_BASE_URL sudah benar
2. Response unwrapping di api/index.js sudah handle error
3. Try/catch di store sudah ada
```

---

*Selalu update PROJECT_CONTEXT.md jika ada perubahan arsitektur atau design system*
*Gunakan prompt secara berurutan untuk hasil terbaik*
