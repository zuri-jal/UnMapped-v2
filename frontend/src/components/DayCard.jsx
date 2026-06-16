import React, { useState } from 'react'

const PERIODS = [
  { key: 'morning',   label: '🌅 Morning' },
  { key: 'afternoon', label: '☀️ Afternoon' },
  { key: 'evening',   label: '🌙 Evening' },
]

export default function DayCard({ day }) {
  const [open, setOpen] = useState(true)
  const dayNum = day.day ?? day.day_number

  return (
    <div className="card-dark mb-2">
      <button
        className="flex items-center justify-between w-full"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-rose-gold flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {dayNum}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-[#F0ECE8] leading-tight">
              Day {dayNum} — {day.location}
            </p>
            {day.date && (
              <p className="text-[9px] text-[#8A7A72] mt-0.5">{day.date}</p>
            )}
          </div>
        </div>
        <span className="text-[10px] text-[#8A7A72]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2 pl-9 border-t border-[#1E1B25] pt-3">
          {PERIODS.map(({ key, label }) =>
            day[key] ? (
              <div key={key}>
                <p className="text-[10px] font-medium text-[#8A7A72] mb-0.5">{label}</p>
                <p className="text-[11px] text-[#F0ECE8] leading-relaxed">{day[key]}</p>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
