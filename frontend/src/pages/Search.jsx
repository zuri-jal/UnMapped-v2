import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, signOut } from '../services/supabase'
import useTripStore from '../store/tripStore'

function PlaneIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 4s-2 1-3.5 2.5L11 8 2.8 6.2c-.5-.1-.9.4-.8.9l1.3 4.2c.1.5.5.8 1 .9L9 12.9l-2 3.3c-.2.3 0 .7.3.9l1.5.7c.3.1.6 0 .8-.2l2.1-2.8 3.4.7c.5.1 1-.3.7-.8z" />
    </svg>
  )
}

export default function Search() {
  const navigate     = useNavigate()
  const { setPendingQuery } = useTripStore()
  const [query, setQuery]   = useState('')
  const [user, setUser]     = useState(null)
  const [prevTrip, setPrevTrip] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      setUser(u)

      // Fetch most recent draft trip
      supabase
        .from('trips')
        .select('destination, id')
        .eq('user_id', u.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data?.length) setPrevTrip(data[0])
        })
    })
  }, [])

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'Explorer'

  const submit = () => {
    const trimmed = query.trim()
    if (!trimmed) return
    setPendingQuery(trimmed)
    navigate('/plan')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center relative overflow-hidden">

      {/* Background pattern */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] glow-rose pointer-events-none" />

      {/* Nav — top left */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0F0D12] border border-[#1E1B25] rounded-xl text-sm text-[#8A7A72] hover:border-rose-gold/40 hover:text-[#F0ECE8] transition-colors"
        >
          My profile
        </button>
        <button
          onClick={() => navigate('/trips')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0F0D12] border border-[#1E1B25] rounded-xl text-sm text-[#8A7A72] hover:border-rose-gold/40 hover:text-[#F0ECE8] transition-colors"
        >
          Trip history
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0F0D12] border border-[#1E1B25] rounded-xl text-sm text-[#8A7A72] hover:border-rose-gold/40 hover:text-[#F0ECE8] transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Previous trip card — top right */}
      {prevTrip && (
        <button
          onClick={() => navigate('/plan')}
          className="absolute top-6 right-6 z-10 flex items-center gap-2 px-4 py-2.5 bg-[#0F0D12] border border-[#1E1B25] rounded-xl text-sm text-[#F0ECE8] hover:border-rose-gold/40 transition-colors"
        >
          <span className="text-[#8A7A72]">Continue planning</span>
          <span className="text-rose-gold font-medium">{prevTrip.destination} →</span>
        </button>
      )}

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">

        <h1 className="text-4xl md:text-5xl font-bold text-[#F0ECE8] text-center mb-10 leading-tight">
          Hi {firstName},{' '}
          <span className="text-rose-gold">where to next?</span>
        </h1>

        {/* Search bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); submit() }}
          className="w-full flex items-center gap-0 bg-[#0F0D12] border border-[#1E1B25] rounded-2xl px-5 py-4 focus-within:border-rose-gold/50 transition-colors"
        >
          <div className="text-[#8A7A72] mr-3">
            <PlaneIcon />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cities, countries or tell us what you're looking for..."
            className="flex-1 bg-transparent text-[#F0ECE8] placeholder-[#8A7A72] text-sm focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="ml-3 bg-rose-gold text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-rose-gold-dark transition-colors shrink-0"
          >
            Explore
          </button>
        </form>
      </div>
    </div>
  )
}
