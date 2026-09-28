import axios from 'axios'

// Backend Flask (omni-invest) melayani /api/* DAN static dist/ dari proses
// yang SAMA di port 4500 (lihat PROJECT_CONTEXT.md — satu Flask app, bukan
// backend terpisah). Karena itu path relatif ("/api") sudah cukup dan justru
// WAJIB dipakai — browser otomatis mengarahkannya ke host:port yang sama
// persis dengan yang dipakai untuk membuka halaman ini, apa pun alamat itu
// (LAN lokal STB server, IP ZeroTier, dst). Sebelumnya baseURL di-hardcode
// ke satu IP tertentu (VITE_API_BASE_URL) — ini yang bikin STB "penampil"
// (device kedua yang cuma terhubung ke STB server lewat ZeroTier, beda
// jalur network dari STB server itu sendiri) gagal total memanggil API:
// browser viewer memanggil IP absolut itu langsung dari jaringannya sendiri,
// bukan "titip" ke STB server, jadi kalau viewer tidak punya rute ke IP itu,
// request timeout — padahal viewer tsb sudah pasti bisa reach host:port yang
// sama karena dari situ jugalah dia berhasil memuat halamannya.
// Vite dev server (`npm run dev`) sudah proxy "/api" -> VITE_API_BASE_URL
// (lihat vite.config.js), jadi path relatif ini tetap jalan normal saat dev.
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor — unwrap Flask envelope, surface errors uniformly
// Flask always returns { "status": "ok"|"error", "data": { ... } }
api.interceptors.response.use(
  (res) => {
    // Surface application-level errors (status 200 but status: 'error')
    if (res.data?.status === 'error') {
      return Promise.reject(new Error(res.data?.message ?? 'API error'))
    }
    // Unwrap envelope: { status, data: <payload> } → expose payload as res.data
    // Falls back to res.data itself if no inner 'data' field exists
    if (res.data?.data !== undefined) {
      return { ...res, data: res.data.data }
    }
    return res
  },
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Network error'
    return Promise.reject(new Error(msg))
  },
)

// --- Portfolio ---
export const getPortfolio = () => api.get('/portfolio')
export const savePortfolio = (data) => api.post('/portfolio', data)

// --- Market ---
export const getMarket = () => api.get('/market')
export const getGoldHistory = () => api.get('/gold-history')

// --- Report ---
export const getReport = () => api.get('/report')

// --- Transactions ---
export const getTransactions = () => api.get('/transactions')
export const addTransaction = (data) => api.post('/transactions', data)

// --- Pipeline ---
// /api/run sekarang async di backend — balas cepat begitu pipeline mulai
// jalan di background thread (bukan lagi nunggu Scavenger+Analyst+Messenger
// selesai sebelum respons, yang dulu gampang lebih dari 15 detik di
// hardware STB dan bikin browser membatalkan request duluan). Progress
// dipantau lewat polling getRunStatus() / getReport(), lihat
// stores/report.js:runPipeline() + startPipelinePolling().
export const runPipeline = () => api.post('/run')
export const getRunStatus = () => api.get('/run/status')

// --- Watchlist ---
export const getWatchlist = () => api.get('/watchlist')
export const saveWatchlist = (data) => api.post('/watchlist', data)
export const validateTicker = (ticker) => api.post('/validate-ticker', { ticker })

export default api
