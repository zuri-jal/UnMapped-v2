import { create } from 'zustand'

/**
 * Global Zustand store for all trip-related UI state.
 *
 * Shape reference:
 *   trip           — PlanResponse object from the backend (or null)
 *   messages       — Chat history array: [{ role: 'user'|'assistant', content: string }]
 *   isLoading      — True while a backend request is in flight
 *   isConfirming   — True when the ConfirmScreen is visible
 *   selectedFlightId — offer_id of the user's chosen flight (or null)
 *   selectedHotelId  — offer_id of the user's chosen hotel (or null)
 */
const useTripStore = create((set, get) => ({
  trip: null,
  messages: [],
  isLoading: false,
  isConfirming: false,
  selectedFlightId: null,
  selectedHotelId: null,

  /** Replace the entire trip object (called after /plan or /update). */
  setTrip: (trip) => set({ trip }),

  /** Append a single message to the chat history. */
  addMessage: (role, content) =>
    set((state) => ({ messages: [...state.messages, { role, content }] })),

  /** Show or hide the full-screen loading overlay. */
  setLoading: (isLoading) => set({ isLoading }),

  /** Show or hide the ConfirmScreen. */
  setIsConfirming: (isConfirming) => set({ isConfirming }),

  /** Mark a flight offer as selected (highlights the FlightCard and uses it in booking). */
  selectFlight: (offerId) => set({ selectedFlightId: offerId }),

  /** Mark a hotel offer as selected (highlights the HotelCard and uses it in booking). */
  selectHotel: (offerId) => set({ selectedHotelId: offerId }),

  /** Reset all trip state — called after a booking is confirmed or user starts over. */
  resetTrip: () =>
    set({
      trip: null,
      messages: [],
      isLoading: false,
      isConfirming: false,
      selectedFlightId: null,
      selectedHotelId: null,
    }),

  // TODO: Add persist middleware (zustand/middleware) to save state to localStorage
  // TODO: Add updateDay(dayNumber, updatedDay) for optimistic itinerary edits
  // TODO: Add setUser(user) to store the authenticated Supabase user globally
}))

export default useTripStore
