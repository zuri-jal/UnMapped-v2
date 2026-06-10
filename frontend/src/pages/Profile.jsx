import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, signOut } from '../services/supabase'

// User profile page — saved trips, preferences, and account settings
export default function Profile() {
  const [user, setUser] = useState(null)
  const [trips, setTrips] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // TODO: Call getCurrentUser() and set user state
    // TODO: If user is null, redirect to / (not authenticated)
    // TODO: Fetch user's trip history from GET /trips?user_id=... via api.js
    // TODO: Fetch user preferences from Supabase `profiles` table
  }, [])

  const handleSignOut = async () => {
    // TODO: Call signOut() from supabase.js
    // TODO: Navigate to landing page on success
  }

  // TODO: Implement edit preferences form (currency, home airport, dietary needs)
  // TODO: Render a grid of trip summary cards for past and upcoming trips
  // TODO: Add delete trip functionality with a confirmation prompt

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Back nav */}
      <button
        className="text-sm text-rose-gold mb-6 hover:underline"
        onClick={() => navigate('/plan')}
      >
        ← Back to planner
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      {/* Account section */}
      <section className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Account</h2>
          <button
            className="text-sm text-rose-gold hover:underline"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
        {/* TODO: Show user avatar, display name, and email */}
        <div className="text-sm text-gray-500">
          {user ? user.email : 'Loading account details…'}
        </div>
      </section>

      {/* My Trips section */}
      <section className="card">
        <h2 className="text-lg font-semibold mb-4">My Trips</h2>
        {trips.length === 0 ? (
          <div className="text-sm text-gray-400 py-4 text-center">
            <p>No trips planned yet.</p>
            <button
              className="btn-primary mt-4 text-sm py-2"
              onClick={() => navigate('/plan')}
            >
              Plan your first trip
            </button>
          </div>
        ) : (
          // TODO: Render trip summary cards (destination, dates, status badge)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{/* trip cards */}</div>
        )}
      </section>
    </div>
  )
}
