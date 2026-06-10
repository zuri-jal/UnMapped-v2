import React, { useState } from 'react'
import useTripStore from '../store/tripStore'
import { confirmTrip } from '../services/api'

// Full-screen confirmation view — shows trip summary before booking is submitted
export default function ConfirmScreen() {
  const {
    trip,
    selectedFlightId,
    selectedHotelId,
    setLoading,
    setIsConfirming,
    addMessage,
    resetTrip,
  } = useTripStore()

  const [booked, setBooked] = useState(false)
  const [bookingRefs, setBookingRefs] = useState(null)
  const [error, setError] = useState(null)

  const selectedFlight = trip?.flights?.find((f) => f.offer_id === selectedFlightId)
  const selectedHotel = trip?.hotels?.find((h) => h.offer_id === selectedHotelId)

  const handleConfirm = async () => {
    // TODO: Validate that both a flight and hotel have been selected
    // TODO: Collect traveller details from a form (currently using placeholder)
    setLoading(true)
    setError(null)

    try {
      const result = await confirmTrip({
        trip_id: trip.trip_id,
        user_id: 'placeholder-user-id', // TODO: get from Supabase session
        selected_flight_id: selectedFlightId,
        selected_hotel_id: selectedHotelId,
        traveller_details: [], // TODO: collect from traveller details form
      })
      setBookingRefs(result)
      setBooked(true)
    } catch (err) {
      setError('Booking failed. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  if (booked && bookingRefs) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full card text-center">
          <p className="text-4xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your trip to {trip?.destination} is confirmed. Check your email for the full itinerary.
          </p>
          <div className="space-y-2 text-sm text-left mb-6">
            {bookingRefs.flight_booking_ref && (
              <div className="flex justify-between">
                <span className="text-gray-500">Flight Ref</span>
                <span className="font-mono font-semibold">{bookingRefs.flight_booking_ref}</span>
              </div>
            )}
            {bookingRefs.hotel_booking_ref && (
              <div className="flex justify-between">
                <span className="text-gray-500">Hotel Ref</span>
                <span className="font-mono font-semibold">{bookingRefs.hotel_booking_ref}</span>
              </div>
            )}
          </div>
          <button className="btn-primary w-full" onClick={resetTrip}>
            Plan Another Trip
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full card">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirm Your Booking</h2>
        <p className="text-sm text-gray-500 mb-6">Review everything before we confirm with the providers.</p>

        {/* Trip summary */}
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between py-2 border-b border-warm-gray">
            <span className="text-gray-500">Destination</span>
            <span className="font-medium">{trip?.destination}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-warm-gray">
            <span className="text-gray-500">Dates</span>
            <span className="font-medium">{trip?.departure_date} → {trip?.return_date}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-warm-gray">
            <span className="text-gray-500">Flight</span>
            <span className="font-medium">
              {selectedFlight
                ? `${selectedFlight.airline} · ${selectedFlight.currency} ${selectedFlight.price.toLocaleString()}`
                : <span className="text-orange-400">None selected</span>}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Hotel</span>
            <span className="font-medium">
              {selectedHotel
                ? `${selectedHotel.name} · ${selectedHotel.currency} ${selectedHotel.price_per_night}/night`
                : <span className="text-orange-400">None selected</span>}
            </span>
          </div>
        </div>

        {/* TODO: Add traveller details form here */}

        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            className="btn-secondary flex-1"
            onClick={() => setIsConfirming(false)}
          >
            ← Back
          </button>
          <button className="btn-primary flex-1" onClick={handleConfirm}>
            Confirm & Book
          </button>
        </div>
      </div>
    </div>
  )
}
