import React, { useState } from 'react'
import TripMap from './TripMap'
import useTripStore from '../store/tripStore'

const DISC_TABS = ['For You', 'Trending', 'Food', 'Experiences']

function DiscoveryCard({ item }) {
  const [liked, setLiked] = useState(false)
  const hearts = item.hearts ?? Math.floor(Math.random() * 900) + 100

  return (
    <div className="shrink-0 w-40 bg-[#0F0D12] border border-[#1E1B25] rounded-xl p-3 hover:border-rose-gold/30 transition-colors">
      <div className="text-xl mb-2">{item.emoji ?? '🌍'}</div>
      <p className="text-xs font-semibold text-[#F0ECE8] truncate">{item.name ?? item.destination}</p>
      <p className="text-[10px] text-[#8A7A72] mt-0.5 truncate">{item.country ?? item.source ?? ''}</p>
      <button
        onClick={() => setLiked((v) => !v)}
        className="flex items-center gap-1 mt-2 text-[10px] transition-colors"
      >
        <span className={liked ? 'text-rose-gold' : 'text-[#8A7A72]'}>♥</span>
        <span className={liked ? 'text-rose-gold' : 'text-[#8A7A72]'}>{liked ? hearts + 1 : hearts}</span>
      </button>
    </div>
  )
}

const STATIC_DISCOVERY = [
  { name: 'Tbilisi',   country: 'Georgia',   emoji: '🏔️', hearts: 1240 },
  { name: 'Kotor',     country: 'Montenegro',emoji: '⚓',  hearts: 879 },
  { name: 'Chefchaouen', country: 'Morocco', emoji: '💙',  hearts: 2100 },
  { name: 'Plovdiv',   country: 'Bulgaria',  emoji: '🎨',  hearts: 634 },
  { name: 'Luang Prabang', country: 'Laos',  emoji: '🛕',  hearts: 1560 },
  { name: 'Valparaíso', country: 'Chile',    emoji: '🎭',  hearts: 988 },
]

export default function CenterPanel() {
  const { tripData, darkMode, toggleDarkMode } = useTripStore()
  const [discTab, setDiscTab] = useState('For You')

  const insights = tripData?.discovery_insights ?? []
  const displayItems = insights.length > 0 ? insights : STATIC_DISCOVERY

  // Filter by tab (use source or type field if available)
  const filtered = displayItems.filter((item) => {
    if (discTab === 'For You') return true
    if (discTab === 'Trending') return item.source === 'google_trends' || !item.source
    if (discTab === 'Food')     return item.source === 'reddit' || item.name?.toLowerCase().includes('food') || !item.source
    if (discTab === 'Experiences') return item.source === 'youtube' || !item.source
    return true
  })

  const destination = tripData?.days?.[0]?.location
    ?? (typeof tripData?.destination === 'string' ? tripData.destination : '')

  const summaryFirst = tripData?.summary ? tripData.summary.split('.')[0].trim() : null
  const tripLabel = summaryFirst
    ? (summaryFirst.length > 40 ? summaryFirst.slice(0, 40) + '…' : summaryFirst)
    : null

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F]">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1B25] shrink-0">
        <div className="flex items-center gap-2">
          {tripLabel ? (
            <>
              <span
                className="text-sm font-semibold text-[#F0ECE8] truncate max-w-[200px]"
                title={tripData.summary}
              >
                {tripLabel}
              </span>
              {tripData?.days?.length && (
                <span className="text-[10px] px-2 py-0.5 bg-[#0F0D12] border border-[#1E1B25] rounded-full text-[#8A7A72]">
                  {tripData.days.length} days
                </span>
              )}
            </>
          ) : destination ? (
            <span className="text-sm font-semibold text-[#F0ECE8] truncate max-w-[200px]">
              {destination}
            </span>
          ) : (
            <span className="text-sm text-[#8A7A72]">Your trip</span>
          )}
        </div>

        {/* Dark/light toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-1.5 text-[10px] text-[#8A7A72] hover:text-[#F0ECE8] transition-colors px-2 py-1 rounded-lg border border-[#1E1B25] hover:border-rose-gold/30"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          <span>{darkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Map — flex-1 so it fills remaining space above discovery */}
      <div className="flex-1 min-h-0 relative">
        {/* Height passed inline because Leaflet needs an explicit pixel height */}
        <div style={{ height: '100%' }}>
          <TripMap darkMode={darkMode} />
        </div>
      </div>

      {/* Discovery section */}
      <div className="shrink-0 border-t border-[#1E1B25] bg-[#0A0A0F]" style={{ maxHeight: '200px' }}>
        <div className="flex items-center gap-1 px-4 pt-3 pb-1">
          <span className="text-xs font-medium text-[#F0ECE8] mr-2">Discover hidden gems</span>
          {DISC_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setDiscTab(t)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                discTab === t
                  ? 'bg-rose-gold border-rose-gold text-white'
                  : 'border-[#1E1B25] text-[#8A7A72] hover:border-rose-gold/40'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-2 scrollbar-hide">
          {(filtered.length > 0 ? filtered : STATIC_DISCOVERY).map((item, i) => (
            <DiscoveryCard key={i} item={item} />
          ))}
        </div>
      </div>

    </div>
  )
}
