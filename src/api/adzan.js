import axios from 'axios'
import { ADZAN_CALCULATION_METHOD } from '@/config/adzan'

// Aladhan adalah API publik pihak ketiga (bukan backend Omni-Invest maupun
// backend Zakanet) — base URL fixed, bukan dari env var, karena sama untuk
// semua environment.
const adzanApi = axios.create({
  baseURL: 'https://api.aladhan.com/v1',
  timeout: 15000,
})

// dateStr format DD-MM-YYYY (format yang diminta endpoint /timings/{date})
export const getTimings = (dateStr, latitude, longitude) =>
  adzanApi.get(`/timings/${dateStr}`, {
    params: { latitude, longitude, method: ADZAN_CALCULATION_METHOD },
  })

export default adzanApi
