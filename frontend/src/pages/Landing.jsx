import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useTrendingDestinations } from '../hooks/useTrendingDestinations'

const scoreLabel = (s) => s > 70 ? 'Fernweh' : s > 50 ? 'Wanderlust' : 'Interesting'

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    title: 'Social discovery',
    body: 'Reddit, YouTube and Google Trends surface hidden gems the algorithms never show you.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 8 12 12 14 14" />
        <path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M9.17 14.83l-4.24 4.24" />
      </svg>
    ),
    title: 'AI trip planning',
    body: 'One message generates a full day-by-day itinerary, flight options and hotel picks.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 4s-2 1-3.5 2.5L11 8 2.8 6.2c-.5-.1-.9.4-.8.9l1.3 4.2c.1.5.5.8 1 .9L9 12.9l-2 3.3c-.2.3 0 .7.3.9l1.5.7c.3.1.6 0 .8-.2l2.1-2.8 3.4.7c.5.1 1-.3.7-.8z" />
      </svg>
    ),
    title: 'Live booking',
    body: 'Real flight and hotel prices via Duffel API — book directly from your itinerary.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const { destinations, loading } = useTrendingDestinations()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/search', { replace: true })
    })
  }, [navigate])

  const handleSeeHow = (e) => {
    e.preventDefault()
    document.getElementById('why-unmapped')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-sans">

      {/* ── Hero section ── */}
      <div className="relative overflow-hidden">
        {/* Dot-grid background */}
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
        {/* Rose-gold radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] glow-rose pointer-events-none" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Unmapped Logo" className="h-10 object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#8A7A72]">
            <a href="#why-unmapped" onClick={handleSeeHow} className="hover:text-[#F0ECE8] transition-colors">
              Features
            </a>
            <a href="#why-unmapped" onClick={handleSeeHow} className="hover:text-[#F0ECE8] transition-colors">
              How it works
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="text-sm text-[#F0ECE8] px-4 py-2 rounded-lg hover:bg-[#1E1B25] transition-colors"
            >
              Log in
            </button>
            <button onClick={() => navigate('/auth')} className="btn-primary text-sm py-2 px-5">
              Get started
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-20">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1E1B25] bg-[#0F0D12] text-xs text-[#8A7A72] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-gold animate-pulse" />
            AI-powered travel discovery
          </span>

          <h1 className="text-5xl md:text-6xl font-bold text-[#F0ECE8] max-w-3xl leading-[1.1] tracking-tight">
            Discover places you{' '}
            <span className="text-rose-gold">never knew</span>
            {' '}existed.
          </h1>

          <p className="mt-5 text-lg text-[#8A7A72] max-w-xl leading-relaxed">
            Tell Unmapped where you want to go — or let it surprise you. One message generates
            flights, hotels, and a full day-by-day itinerary.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary text-base px-8 py-3"
            >
              Start exploring →
            </button>
            <button
              onClick={handleSeeHow}
              className="text-sm text-[#8A7A72] hover:text-[#F0ECE8] transition-colors px-4 py-3"
            >
              See how it works
            </button>
          </div>
        </div>

        {/* Destination cards row */}
        <div className="relative z-10 flex gap-4 justify-center px-6 pb-16 flex-wrap">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-48 bg-[#0F0D12] border border-[#1E1B25] rounded-2xl p-4 animate-pulse"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1E1B25] mb-3" />
                  <div className="h-3 w-24 rounded bg-[#1E1B25] mb-2" />
                  <div className="h-2.5 w-16 rounded bg-[#1E1B25] mb-3" />
                  <div className="h-4 w-20 rounded-full bg-[#1E1B25]" />
                </div>
              ))
            : destinations.map((d) => (
                <div
                  key={d.destination}
                  className="w-48 bg-[#0F0D12] border border-[#1E1B25] rounded-2xl p-4 hover:border-rose-gold/40 transition-colors cursor-pointer"
                >
                  <div className="text-3xl mb-3">🌍</div>
                  <p className="font-semibold text-[#F0ECE8] text-sm">{d.destination}</p>
                  <p className="text-xs text-[#8A7A72] mt-0.5">{d.country}</p>
                  <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 bg-rose-gold/10 rounded-full">
                    <span className="text-[10px] font-semibold text-rose-gold">{d.score}</span>
                    <span className="text-[10px] text-[#8A7A72]">· {scoreLabel(d.score)}</span>
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* ── Why Unmapped — light section ── */}
      <div id="why-unmapped" className="bg-[#FDFAF8] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-rose-gold uppercase tracking-widest text-center mb-3">
            Why Unmapped?
          </p>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Travel planning, actually reimagined.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="w-10 h-10 rounded-xl bg-rose-gold/10 flex items-center justify-center text-rose-gold mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quote section — dark ── */}
      <div className="bg-[#0A0A0F] py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl text-rose-gold font-serif leading-none mb-6 select-none">"</div>
          <p className="text-xl text-[#F0ECE8] leading-relaxed font-light italic">
            I found a place I never would've thought to search. AI-powered discovery actually works.
            Ended up spending three weeks in Georgia instead of Greece and it was the best trip of my life.
          </p>
          <div className="mt-6 text-sm text-[#8A7A72]">
            <span className="text-rose-gold font-medium">u/wanderlust_dev</span>
            {' · '}r/solotravel
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-[#0A0A0F] border-t border-[#1E1B25] py-12 px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xl font-bold text-rose-gold">Unmapped</span>
            <p className="text-sm text-[#8A7A72] mt-1">Travel the world, planned by AI.</p>
          </div>
          <button onClick={() => navigate('/auth')} className="btn-primary text-sm py-2 px-6">
            Get Started →
          </button>
        </div>
      </footer>
    </div>
  )
}
