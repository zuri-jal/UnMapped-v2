import axios from 'axios'
import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      supabase.auth.signOut()
      window.location.href = '/auth'
    }
    if (err.response?.status === 422) {
      const details = err.response.data?.detail
      if (Array.isArray(details)) {
        err.message = `Validation error: ${details.map((d) => d.msg).join(', ')}`
      }
    }
    return Promise.reject(err)
  }
)

export async function planTrip(data) {
  try {
    const res = await api.post('/plan', data)
    return { data: res.data, error: null }
  } catch (err) {
    return { data: null, error: err.message ?? 'Request failed' }
  }
}

export async function updateTrip(data) {
  try {
    const res = await api.post('/update', data)
    return { data: res.data, error: null }
  } catch (err) {
    return { data: null, error: err.message ?? 'Request failed' }
  }
}

export async function confirmTrip(data) {
  try {
    const res = await api.post('/confirm', data)
    return { data: res.data, error: null }
  } catch (err) {
    return { data: null, error: err.message ?? 'Request failed' }
  }
}

export async function getDiscovery(data = {}) {
  try {
    const res = await api.post('/discover', data)
    return { data: res.data, error: null }
  } catch (err) {
    return { data: null, error: err.message ?? 'Request failed' }
  }
}
