import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor — unwrap .data, surface errors uniformly
api.interceptors.response.use(
  (res) => res,
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

// --- Report ---
export const getReport = () => api.get('/report')

// --- Transactions ---
export const getTransactions = () => api.get('/transactions')
export const addTransaction = (data) => api.post('/transactions', data)

// --- Pipeline ---
export const runPipeline = () => api.post('/run')

export default api
