import { create } from 'zustand'

const _darkInit = (() => {
  try { return localStorage.getItem('unmapped-dark') !== 'false' } catch { return true }
})()

function calcTotal(tripData, flightIds, gtIds) {
  const cities     = tripData?.cities          ?? []
  const flights    = tripData?.flights         ?? []
  const groundLegs = tripData?.ground_transport ?? []

  const flightCost = Object.values(flightIds).reduce((sum, fId) => {
    const f = flights.find((fl) => (fl.flight_number || fl.offer_id || '') === fId)
    return sum + Number(f?.price_usd ?? 0)
  }, 0)

  const gtCost = Object.entries(gtIds).reduce((sum, [legKey, optId]) => {
    const [from, ...toParts] = legKey.split(' → ')
    const to = toParts.join(' → ')
    const gtLeg = groundLegs.find((gl) => gl.leg_from === from && gl.leg_to === to)
    const opt   = gtLeg?.options?.find((o) => o.id === optId)
    return sum + Number(opt?.price_usd ?? 0)
  }, 0)

  const hotelCost = cities.reduce((sum, city) => {
    return sum + Number(city.hotel?.price_per_night_usd ?? 0) * (city.day_count ?? 0)
  }, 0)

  return flightCost + gtCost + hotelCost
}

const useTripStore = create((set) => ({
  tripData: null,
  messages: [],
  // Per-leg flight selection: { "City A → City B": "flightIdentifier" }
  selectedFlightIds: {},
  // Per-leg ground transport selection: { "City A → City B": "optionId" }
  selectedGroundTransportIds: {},
  totalCost: 0,
  isLoading: false,
  isConfirming: false,
  darkMode: _darkInit,
  pendingQuery: null,
  pendingPlanConfirm: null,

  setTripData: (tripData) =>
    set({ tripData, selectedFlightIds: {}, selectedGroundTransportIds: {}, totalCost: 0 }),

  addMessage: (role, content) =>
    set((s) => ({ messages: [...s.messages, { role, content }] })),

  // Selecting a flight clears any ground transport choice for the same leg
  selectFlight: (legKey, id) =>
    set((s) => {
      const newFlightIds = { ...s.selectedFlightIds, [legKey]: id }
      const newGtIds     = { ...s.selectedGroundTransportIds }
      delete newGtIds[legKey]
      return {
        selectedFlightIds: newFlightIds,
        selectedGroundTransportIds: newGtIds,
        totalCost: calcTotal(s.tripData, newFlightIds, newGtIds),
      }
    }),

  // Selecting ground transport clears any flight choice for the same leg
  selectGroundTransport: (legKey, id) =>
    set((s) => {
      const newGtIds     = { ...s.selectedGroundTransportIds, [legKey]: id }
      const newFlightIds = { ...s.selectedFlightIds }
      delete newFlightIds[legKey]
      return {
        selectedGroundTransportIds: newGtIds,
        selectedFlightIds: newFlightIds,
        totalCost: calcTotal(s.tripData, newFlightIds, newGtIds),
      }
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
  setPendingPlanConfirm: (v) => set({ pendingPlanConfirm: v }),

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
      selectedGroundTransportIds: {},
      totalCost: 0,
    }),
}))

export default useTripStore
