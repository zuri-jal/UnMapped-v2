import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the Supabase JWT to every outgoing request
api.interceptors.request.use(async (config) => {
  // TODO: Import supabase client and call supabase.auth.getSession()
  // TODO: If session exists, set config.headers.Authorization = `Bearer ${session.access_token}`
  return config
})

// Global response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: Import supabase and call supabase.auth.signOut()
      // TODO: Redirect to the landing page using window.location or React Router
    }
    if (error.response?.status === 422) {
      // Pydantic validation error — extract detail array for display
      const details = error.response.data?.detail
      if (Array.isArray(details)) {
        const messages = details.map((d) => d.msg).join(', ')
        error.message = `Validation error: ${messages}`
      }
    }
    return Promise.reject(error)
  }
)

/**
 * POST /plan
 * Send a natural-language trip planning message and receive a full PlanResponse.
 * @param {Object} payload - { user_id, message, origin?, destination?, departure_date?, budget?, currency?, travellers?, preferences? }
 * @returns {Promise<Object>} PlanResponse
 */
export async function planTrip(payload) {
  const { data } = await api.post('/plan', payload)
  return data
}

/**
 * POST /update
 * Apply a natural-language change instruction to an existing trip.
 * @param {Object} payload - { trip_id, user_id, message }
 * @returns {Promise<Object>} UpdateResponse
 */
export async function updateTrip(payload) {
  const { data } = await api.post('/update', payload)
  return data
}

/**
 * POST /confirm
 * Confirm and book the selected flight and hotel for a trip.
 * @param {Object} payload - { trip_id, user_id, selected_flight_id, selected_hotel_id, traveller_details }
 * @returns {Promise<Object>} ConfirmResponse with booking refs and pdf_url
 */
export async function confirmTrip(payload) {
  const { data } = await api.post('/confirm', payload)
  return data
}

/**
 * POST /discover
 * Discover trending and community-recommended destinations.
 * @param {Object} payload - { query?, budget?, currency?, season?, region?, vibe? }
 * @returns {Promise<Object>} DiscoverResponse with list of DestinationCard objects
 */
export async function discoverDestinations(payload) {
  const { data } = await api.post('/discover', payload)
  return data
}
