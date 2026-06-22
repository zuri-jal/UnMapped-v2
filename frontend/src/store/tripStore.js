import { create } from 'zustand'

const _darkInit = (() => {
  try { return localStorage.getItem('unmapped-dark') !== 'false' } catch { return true }
})()

function calcTotal(tripData, flightIds) {
  const cities  = tripData?.cities  ?? []
  const flights = tripData?.flights ?? []
  const flightCost = Object.values(flightIds).reduce((sum, fId) => {
    const f = flights.find((fl) => (fl.flight_number || fl.offer_id || '') === fId)
    return sum + Number(f?.price_usd ?? 0)
  }, 0)
  const hotelCost = cities.reduce((sum, city) => {
    return sum + Number(city.hotel?.price_per_night_usd ?? 0) * (city.day_count ?? 0)
  }, 0)
  return flightCost + hotelCost
}

const useTripStore = create((set) => ({
  tripData: null,
  messages: [],
  // Per-leg flight selection: { "City A → City B": "flightIdentifier" }
  selectedFlightIds: {},
  totalCost: 0,
  isLoading: false,
  isConfirming: false,
  darkMode: _darkInit,
  pendingQuery: null,

  setTripData: (tripData) =>
    set({ tripData, selectedFlightIds: {}, totalCost: 0 }),

  addMessage: (role, content) =>
    set((s) => ({ messages: [...s.messages, { role, content }] })),

  selectFlight: (legKey, id) =>
    set((s) => {
      const newIds = { ...s.selectedFlightIds, [legKey]: id }
      return { selectedFlightIds: newIds, totalCost: calcTotal(s.tripData, newIds) }
    }),

  reorderCities: (fromIdx, toIdx) =>
    set((s) => {
      if (!s.tripData?.cities) return {}
      const cities = [...s.tripData.cities]
      const [moved] = cities.splice(fromIdx, 1)
      cities.splice(toIdx, 0, moved)
      return { tripData: { ...s.tripData, cities } }
    }),

  removeCity: (idx) =>
    set((s) => {
      if (!s.tripData?.cities) return {}
      const cities = s.tripData.cities.filter((_, i) => i !== idx)
      return { tripData: { ...s.tripData, cities } }
    }),

  updateCityDayCount: (idx, count) =>
    set((s) => {
      if (!s.tripData?.cities) return {}
      const cities = s.tripData.cities.map((c, i) =>
        i === idx ? { ...c, day_count: Math.max(1, count) } : c
      )
      return { tripData: { ...s.tripData, cities } }
    }),

  setCities: (cities) =>
    set((s) => ({ tripData: { ...s.tripData, cities } })),

  setLoading:    (v) => set({ isLoading: v }),
  setConfirming: (v) => set({ isConfirming: v }),

  setPendingQuery: (q) => set({ pendingQuery: q }),

  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode
      try { localStorage.setItem('unmapped-dark', String(next)) } catch {}
      return { darkMode: next }
    }),

  reset: () =>
    set({
      tripData: null,
      messages: [],
      isLoading: false,
      isConfirming: false,
      selectedFlightIds: {},
      totalCost: 0,
    }),
}))

export default useTripStore
