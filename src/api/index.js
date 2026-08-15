import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
// /api/run menjalankan seluruh pipeline (Scavenger+Analyst+Messenger) SECARA
// SINKRON di backend — baru response setelah semuanya selesai. Di hardware
// yang lebih lambat (STB Armbian) ini bisa lebih dari 15 detik (default
// timeout instance `api`), jadi browser membatalkan request duluan padahal
// backend-nya sendiri tetap jalan & akan berhasil. Kasih timeout jauh lebih
// longgar khusus untuk panggilan ini saja.
export const runPipeline = () => api.post('/run', null, { timeout: 120000 })

// --- Watchlist ---
export const getWatchlist = () => api.get('/watchlist')
export const saveWatchlist = (data) => api.post('/watchlist', data)
export const validateTicker = (ticker) => api.post('/validate-ticker', { ticker })

export default api
