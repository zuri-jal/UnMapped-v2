import React from 'react'
import { useNavigate } from 'react-router-dom'

// Landing page — hero section, feature highlights, and CTA to start planning
export default function Landing() {
  const navigate = useNavigate()

  // TODO: Add auth state listener via onAuthStateChange — redirect to /plan if logged in
  // TODO: Add animated hero section with parallax destination imagery
  // TODO: Add feature highlights section (AI planning, real bookings, community discovery)
  // TODO: Add testimonials / social proof section
  // TODO: Hook up Sign In / Sign Up buttons to a Supabase auth modal

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-warm-gray">
        <span className="text-2xl font-semibold text-rose-gold tracking-tight">Unmapped</span>
        <div className="flex gap-4">
          <button className="btn-secondary" onClick={() => {/* TODO: open sign-in modal */}}>
            Sign In
          </button>
          <button className="btn-primary" onClick={() => navigate('/plan')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <h1 className="text-6xl font-bold text-gray-900 max-w-3xl leading-tight">
          Travel the world,{' '}
          <span className="text-rose-gold">planned by AI</span>
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-xl leading-relaxed">
          Tell Unmapped where you want to go. We'll handle flights, hotels, and every detail in between.
        </p>
        <button
          className="btn-primary mt-10 text-lg px-10 py-4"
          onClick={() => navigate('/plan')}
        >
          Start Planning for Free
        </button>

        {/* Feature grid — placeholder */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-left">
          {[
            { icon: '✈️', title: 'Real Flights & Hotels', body: 'Live prices and instant booking via Duffel.' },
            { icon: '🤖', title: 'AI Itineraries', body: 'GPT-4 plans your days so you can focus on enjoying them.' },
            { icon: '🌍', title: 'Community Discovery', body: 'Reddit, YouTube and Google Trends surface hidden gems.' },
          ].map(({ icon, title, body }) => (
            <div key={title} className="card">
              <p className="text-3xl mb-3">{icon}</p>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
