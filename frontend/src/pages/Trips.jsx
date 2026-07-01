import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/supabase'
import { getTrips, getTrip } from '../services/api'
import useTripStore from '../store/tripStore'

function StatusBadge({ status }) {
  const styles = {
    confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    planned:   'bg-[#B07050]/15 text-[#B07050] border-[#B07050]/25',
  }
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${styles[status] ?? 'bg-[#1E1B25] text-[#8A7A72] border-[#1E1B25]'}`}>
      {status}
    </span>
  )
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Trips() {
  const navigate = useNavigate()
  const { setTripData } = useTripStore()

  const [user, setUser]       = useState(null)
  const [trips, setTrips]     = useState([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(null)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getCurrentUser().then(async (u) => {
      if (!u) { navigate('/auth'); return }
      setUser(u)
      const { data, error: err } = await getTrips(u.id)
      if (err) setError(err)
      else setTrips(data ?? [])
      setLoading(false)
    })
  }, [])

  const handleRestore = async (tripId) => {
    if (!user || restoring) return
    setRestoring(tripId)
    const { data, error: err } = await getTrip(tripId, user.id)
    if (err || !data) {
      setRestoring(null)
      return
    }
    setTripData({
      cities:             data.itinerary?.cities ?? data.itinerary ?? [],
      flights:            data.flights   ?? [],
      summary:            data.itinerary?.summary ?? '',
      budget_breakdown:   {},
      discovery_insights: [],
      hidden_gems:        [],
    })
    navigate('/plan')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <p className="text-sm text-[#8A7A72]">Loading trips…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-6">
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate('/search')}
          className="flex items-center gap-1.5 text-sm text-[#8A7A72] hover:text-[#F0ECE8] transition-colors mb-8"
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#F0ECE8]">Trip history</h1>
          <p className="text-sm text-[#8A7A72] mt-1">Click any trip to restore it into the planner.</p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-6">
            {error}
          </p>
        )}

        {trips.length === 0 ? (
          <div className="bg-[#0F0D12] border border-[#1E1B25] rounded-2xl px-6 py-10 text-center">
            <p className="text-sm text-[#8A7A72]">No trips yet. Start planning one!</p>
            <button
              onClick={() => navigate('/search')}
              className="mt-4 px-5 py-2 bg-[#B07050] text-white text-sm font-medium rounded-xl hover:bg-[#9A6040] transition-colors"
            >
              Plan a trip
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => handleRestore(trip.id)}
                disabled={restoring === trip.id}
                className="w-full text-left bg-[#0F0D12] border border-[#1E1B25] rounded-2xl px-5 py-4 hover:border-[#B07050]/40 transition-colors disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[#F0ECE8] font-medium text-sm truncate">
                      {trip.destination || 'Unknown destination'}
                    </p>
                    <p className="text-[#8A7A72] text-xs mt-1">
                      {fmt(trip.departure_date)} – {fmt(trip.return_date)}
                    </p>
                    <p className="text-[#4A4050] text-xs mt-0.5">
                      Saved {fmt(trip.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={trip.status} />
                    {restoring === trip.id && (
                      <span className="text-[10px] text-[#8A7A72]">Restoring…</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
