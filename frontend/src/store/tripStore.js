import { create } from 'zustand'

const _darkInit = (() => {
  try { return localStorage.getItem('unmapped-dark') !== 'false' } catch { return true }
})()

const useTripStore = create((set) => ({
  tripData: null,
  messages: [],
  selectedFlightId: null,
  selectedHotelId: null,
  totalCost: 0,
  isLoading: false,
  isConfirming: false,
  darkMode: _darkInit,
  pendingQuery: null,

  setTripData: (tripData) =>
    set({ tripData, selectedFlightId: null, selectedHotelId: null, totalCost: 0 }),

  addMessage: (role, content) =>
    set((s) => ({ messages: [...s.messages, { role, content }] })),

  selectFlight: (id) =>
    set((s) => {
      const flight = s.tripData?.flights?.find((f) => (f.flight_number || '') === id)
      const hotel  = s.tripData?.hotels?.find((h) => (h.name || '') === s.selectedHotelId)
      const nights = s.tripData?.days?.length ?? 7
      const totalCost =
        Number(flight?.price_usd ?? 0) + Number(hotel?.price_per_night_usd ?? 0) * nights
      return { selectedFlightId: id, totalCost }
    }),

  selectHotel: (id) =>
    set((s) => {
      const flight = s.tripData?.flights?.find((f) => (f.flight_number || '') === s.selectedFlightId)
      const hotel  = s.tripData?.hotels?.find((h) => (h.name || '') === id)
      const nights = s.tripData?.days?.length ?? 7
      const totalCost =
        Number(flight?.price_usd ?? 0) + Number(hotel?.price_per_night_usd ?? 0) * nights
      return { selectedHotelId: id, totalCost }
    }),

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
      selectedFlightId: null,
      selectedHotelId: null,
      totalCost: 0,
    }),
}))

export default useTripStore
