import axios from 'axios'

// Backend Zakanet Monitoring adalah service terpisah dari backend Omni-Invest
// (base URL sendiri, bukan lewat VITE_API_BASE_URL / envelope Flask di api/index.js).
const monitorApi = axios.create({
  baseURL: import.meta.env.VITE_ZAKANET_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export const getClients = () => monitorApi.get('/clients')
export const getClusters = () => monitorApi.get('/clusters')
export const syncClients = () => monitorApi.post('/sync/clients')

export default monitorApi
