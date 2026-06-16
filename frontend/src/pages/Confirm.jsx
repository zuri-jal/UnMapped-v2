import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useTripStore from '../store/tripStore'
import { confirmTrip } from '../services/api'
import { getCurrentUser } from '../services/supabase'

function launchConfetti() {
  import('canvas-confetti').then((m) => {
    const confetti = m.default
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#B07050', '#C4896A', '#F0ECE8', '#5DCAA5'] })
    setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.45 }, colors: ['#B07050', '#F0ECE8'] }), 300)
  })
}

export default function Confirm() {
  const navigate = useNavigate()
  const { tripData, selectedFlightId, selectedHotelId, reset } = useTripStore()

  const [passengerName, setPassengerName] = useState('')
  const [passengerEmail, setPassengerEmail] = useState('')
  const [card, setCard]       = useState('')
  const [expiry, setExpiry]   = useState('')
  const [cvv, setCvv]         = useState('')
  const [loading, setLoading] = useState(false)
  const [booked, setBooked]   = useState(false)
  const [refs, setRefs]       = useState(null)
  const [error, setError]     = useState(null)

  const confettiFired = useRef(false)

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user?.email) setPassengerEmail(user.email)
    })
  }, [])

  useEffect(() => {
    if (booked && !confettiFired.current) {
      confettiFired.current = true
      launchConfetti()
    }
  }, [booked])

  const selFlight = tripData?.flights?.find((f) => (f.flight_number || '') === selectedFlightId)
  const selHotel  = tripData?.hotels?.find((h) => (h.name || '') === selectedHotelId)
  const nights    = tripData?.days?.length ?? 7

  const flightTotal  = Number(selFlight?.price_usd ?? 0)
  const hotelTotal   = Number(selHotel?.price_per_night_usd ?? 0) * nights
  const grandTotal   = flightTotal + hotelTotal

  const handleConfirm = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const user = await getCurrentUser()

    const { data, error: apiErr } = await confirmTrip({
      user_id: user?.id ?? null,
      trip_data: tripData ?? {},
      selected_flight: {
        airline:        selFlight?.airline ?? '',
        flight_number:  selFlight?.flight_number ?? selFlight?.offer_id ?? null,
        departure_time: selFlight?.departure_time ?? '',
        arrival_time:   selFlight?.arrival_time ?? '',
        duration:       selFlight?.duration ?? null,
        price_usd:      selFlight?.price ?? selFlight?.price_usd ?? 0,
        stops:          selFlight?.stops ?? 0,
      },
      selected_hotel: {
        name:              selHotel?.name ?? '',
        stars:             selHotel?.stars ?? null,
        price_per_night_usd: selHotel?.price_per_night ?? selHotel?.price_per_night_usd ?? 0,
        total_price_usd:   hotelTotal,
        location:          selHotel?.city ?? selHotel?.location ?? '',
        check_in:          selHotel?.check_in ?? tripData?.days?.[0]?.date ?? null,
        check_out:         selHotel?.check_out ?? tripData?.days?.at(-1)?.date ?? null,
      },
      total_cost:      grandTotal,
      passenger_name:  passengerName,
      passenger_email: passengerEmail,
    })

    if (apiErr) {
      setError(apiErr)
    } else {
      setRefs(data)
      setBooked(true)
    }
    setLoading(false)
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (booked) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0F0D12] border border-[#1E1B25] rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-[#F0ECE8] mb-2">You're all set!</h2>
          <p className="text-sm text-[#8A7A72] mb-8 leading-relaxed">
            Check your email for your full itinerary and booking receipt.
          </p>

          {/* Booking ref */}
          {refs?.booking_reference && (
            <div className="bg-[#0A0A0F] border border-[#1E1B25] rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-[#8A7A72]">Booking ref</span>
                <span className="font-mono font-semibold text-[#F0ECE8]">{refs.booking_reference}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-[#5DCAA5] mb-6">Check your email for your receipt →</p>

          <button
            onClick={() => { reset(); navigate('/search') }}
            className="btn-primary w-full"
          >
            Plan another trip
          </button>
        </div>
      </div>
    )
  }

  // ── Main confirm form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-6">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/plan')}
          className="flex items-center gap-1.5 text-sm text-[#8A7A72] hover:text-[#F0ECE8] transition-colors mb-8"
        >
          ← Back to planner
        </button>

        <h1 className="text-2xl font-bold text-[#F0ECE8] mb-1">Confirm your booking</h1>
        <p className="text-sm text-[#8A7A72] mb-8">Review everything before we confirm with the providers.</p>

        {/* Trip summary */}
        <div className="bg-[#0F0D12] border border-[#1E1B25] rounded-2xl p-5 mb-4">
          <h3 className="text-xs font-semibold text-[#8A7A72] uppercase tracking-wider mb-3">Trip summary</h3>
          <div className="space-y-2 text-sm">
            <Row label="Destination" value={tripData?.days?.[0]?.location ?? '—'} />
            <Row label="Dates" value={`${tripData?.days?.[0]?.date ?? '—'} → ${tripData?.days?.at(-1)?.date ?? '—'}`} />
            <Row label="Duration" value={`${nights} nights`} />
          </div>
        </div>

        {/* Selected flight */}
        <div className="bg-[#0F0D12] border border-[#1E1B25] rounded-2xl p-5 mb-4">
          <h3 className="text-xs font-semibold text-[#8A7A72] uppercase tracking-wider mb-3">Flight</h3>
          {selFlight ? (
            <div className="space-y-1.5 text-sm">
              <Row label="Airline"  value={selFlight.airline} />
              <Row label="Flight"   value={selFlight.flight_number} />
              <Row label="Departs"  value={selFlight.departure_time} />
              <Row label="Arrives"  value={selFlight.arrival_time} />
              <Row label="Stops"    value={selFlight.stops === 0 ? 'Nonstop' : `${selFlight.stops} stop(s)`} />
              <Row label="Price"    value={`$${flightTotal.toLocaleString()}`} highlight />
            </div>
          ) : (
            <p className="text-sm text-orange-400">No flight selected — go back and choose one.</p>
          )}
        </div>

        {/* Selected hotel */}
        <div className="bg-[#0F0D12] border border-[#1E1B25] rounded-2xl p-5 mb-4">
          <h3 className="text-xs font-semibold text-[#8A7A72] uppercase tracking-wider mb-3">Hotel</h3>
          {selHotel ? (
            <div className="space-y-1.5 text-sm">
              <Row label="Hotel"    value={selHotel.name} />
              <Row label="Location" value={selHotel.location} />
              <Row label="Check-in" value={selHotel.check_in} />
              <Row label="Check-out" value={selHotel.check_out} />
              <Row label="Nights"   value={String(nights)} />
              <Row label="Total"    value={`$${hotelTotal.toLocaleString()}`} highlight />
            </div>
          ) : (
            <p className="text-sm text-orange-400">No hotel selected — go back and choose one.</p>
          )}
        </div>

        {/* Budget breakdown */}
        <div className="bg-[#0F0D12] border border-[#1E1B25] rounded-2xl p-5 mb-4">
          <h3 className="text-xs font-semibold text-[#8A7A72] uppercase tracking-wider mb-3">Total cost</h3>
          <div className="space-y-1.5 text-sm">
            <Row label="Flights"       value={`$${flightTotal.toLocaleString()}`} />
            <Row label="Accommodation" value={`$${hotelTotal.toLocaleString()}`} />
          </div>
          <div className="mt-3 pt-3 border-t border-[#1E1B25] flex justify-between">
            <span className="font-semibold text-[#F0ECE8]">Grand total</span>
            <span className="font-bold text-rose-gold text-lg">${grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Mock payment form */}
        <form onSubmit={handleConfirm}>
          <div className="bg-[#0F0D12] border border-[#1E1B25] rounded-2xl p-5 mb-4">
            <h3 className="text-xs font-semibold text-[#8A7A72] uppercase tracking-wider mb-3">Passenger</h3>
            <div>
              <label className="block text-[11px] text-[#8A7A72] mb-1">Full name</label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                placeholder="Jane Smith"
                className="input-dark text-sm"
                required
              />
            </div>
            {passengerEmail && (
              <p className="text-[10px] text-[#8A7A72] mt-2">
                Confirmation will be sent to <span className="text-[#F0ECE8]">{passengerEmail}</span>
              </p>
            )}
          </div>

          <div className="bg-[#0F0D12] border border-[#1E1B25] rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-[#8A7A72] uppercase tracking-wider">Payment</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5DCAA5]/10 text-[#5DCAA5] border border-[#5DCAA5]/20 font-medium">
                Test mode — no real payment
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#8A7A72] mb-1">Card number</label>
                <input
                  type="text"
                  value={card}
                  onChange={(e) => setCard(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="4242 4242 4242 4242"
                  className="input-dark text-sm"
                  maxLength={16}
                  required
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-[#8A7A72] mb-1">Expiry</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM / YY"
                    className="input-dark text-sm"
                    maxLength={7}
                    required
                  />
                </div>
                <div className="w-28">
                  <label className="block text-[11px] text-[#8A7A72] mb-1">CVV</label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    className="input-dark text-sm"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !selFlight || !selHotel}
            className="btn-primary w-full text-base py-3.5"
          >
            {loading ? 'Confirming booking…' : `Confirm and book · $${grandTotal.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between py-1 border-b border-[#1E1B25] last:border-0">
      <span className="text-[#8A7A72]">{label}</span>
      <span className={highlight ? 'font-bold text-rose-gold' : 'font-medium text-[#F0ECE8]'}>{value}</span>
    </div>
  )
}
