import React, { useState } from 'react'

const PERIODS = [
  { key: 'morning',   label: '🌅 Morning' },
  { key: 'afternoon', label: '☀️ Afternoon' },
  { key: 'evening',   label: '🌙 Evening' },
]

export default function DayCard({ day, cityColor = '#C9916E' }) {
  const [open, setOpen] = useState(true)
  const dayNum = day.day ?? day.day_number

  return (
    <div className="card-dark mb-3 relative overflow-hidden pl-5">
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: cityColor }} />
      <button
        className="flex items-center justify-between w-full focus:outline-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-plan-surface-3 border border-plan-border-subtle flex items-center justify-center text-plan-primary text-[11px] font-bold shrink-0 shadow-sm">
            {dayNum}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-plan-text-primary leading-tight">
              Day {dayNum} — {day.location}
            </p>
            {day.date && (
              <p className="text-[10px] text-plan-text-secondary mt-0.5">{day.date}</p>
            )}
          </div>
        </div>
        <span className={`text-[10px] text-plan-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
        <div className="space-y-3 pl-10 border-t border-plan-border-subtle pt-3">
          {PERIODS.map(({ key, label }) =>
            day[key] ? (
              <div key={key}>
                <p className="text-[10px] font-bold text-plan-text-secondary mb-1">{label}</p>
                <p className="text-[11px] text-plan-text-primary leading-relaxed">{day[key]}</p>
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  )
}
