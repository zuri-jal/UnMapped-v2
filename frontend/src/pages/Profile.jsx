import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/supabase'
import { getProfile, updateProfile } from '../services/api'

const TRAVEL_STYLES  = ['Adventure', 'Relaxation', 'Culture', 'Food & Drink', 'Luxury', 'Budget', 'Eco & Nature', 'Hidden Gems']
const BUDGET_RANGES  = ['Under $1,000', '$1,000–$2,500', '$2,500–$5,000', '$5,000–$10,000', '$10,000+']
const CURRENCIES     = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'LKR', 'INR', 'THB', 'MXN']
const INTERESTS      = ['Hiking', 'Food & Dining', 'History & Culture', 'Beaches', 'Nightlife', 'Art & Museums', 'Shopping', 'Photography', 'Wellness', 'Wildlife', 'Architecture', 'Local Experiences']
const DIETARY        = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Dairy-free', 'Nut-free', 'Pescatarian']

const EMPTY_FORM = {
  home_city: '',
  travel_style: '',
  budget_range: '',
  interests: [],
  currency: '',
  dietary_restrictions: [],
}

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser]     = useState(null)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getCurrentUser().then(async (u) => {
      if (!u) { navigate('/auth'); return }
      setUser(u)
      const { data } = await getProfile(u.id)
      if (data) {
        setForm({
          home_city:            data.home_city            ?? '',
          travel_style:         data.travel_style         ?? '',
          budget_range:         data.budget_range         ?? '',
          interests:            data.interests            ?? [],
          currency:             data.currency             ?? '',
          dietary_restrictions: data.dietary_restrictions ?? [],
        })
      }
      setLoading(false)
    })
  }, [])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const toggleChip = (key, val) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val],
    }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error: apiErr } = await updateProfile({ user_id: user.id, ...form })
    if (apiErr) {
      setError(apiErr)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <p className="text-sm text-[#8A7A72]">Loading profile…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-6">
      <div className="max-w-xl mx-auto">

        <button
          onClick={() => navigate('/search')}
          className="flex items-center gap-1.5 text-sm text-[#8A7A72] hover:text-[#F0ECE8] transition-colors mb-8"
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#F0ECE8]">My profile</h1>
          {user?.email && (
            <p className="text-sm text-[#8A7A72] mt-1">{user.email}</p>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">

          {/* Location */}
          <Section title="Location">
            <Field label="Home city">
              <input
                type="text"
                value={form.home_city}
                onChange={(e) => set('home_city', e.target.value)}
                placeholder="e.g. London"
                className="input-dark text-sm"
              />
            </Field>
          </Section>

          {/* Travel preferences */}
          <Section title="Travel preferences">
            <Field label="Travel style">
              <Select
                value={form.travel_style}
                onChange={(v) => set('travel_style', v)}
                options={TRAVEL_STYLES}
                placeholder="Select a style"
              />
            </Field>

            <Field label="Typical budget per trip">
              <Select
                value={form.budget_range}
                onChange={(v) => set('budget_range', v)}
                options={BUDGET_RANGES}
                placeholder="Select a range"
              />
            </Field>

            <Field label="Interests">
              <ChipGroup
                options={INTERESTS}
                selected={form.interests}
                onToggle={(v) => toggleChip('interests', v)}
              />
            </Field>
          </Section>

          {/* Other */}
          <Section title="Other">
            <Field label="Preferred currency">
              <Select
                value={form.currency}
                onChange={(v) => set('currency', v)}
                options={CURRENCIES}
                placeholder="Select a currency"
              />
            </Field>

            <Field label="Dietary restrictions">
              <ChipGroup
                options={DIETARY}
                selected={form.dietary_restrictions}
                onToggle={(v) => toggleChip('dietary_restrictions', v)}
              />
            </Field>
          </Section>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
              saved
                ? 'bg-[#5DCAA5] text-white'
                : 'btn-primary'
            }`}
          >
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save profile'}
          </button>

        </form>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-[#0F0D12] border border-[#1E1B25] rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-[#8A7A72] uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] text-[#8A7A72] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-dark text-sm w-full"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function ChipGroup({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            selected.includes(opt)
              ? 'bg-rose-gold border-rose-gold text-white'
              : 'border-[#1E1B25] text-[#8A7A72] hover:border-rose-gold/50 hover:text-[#F0ECE8]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
