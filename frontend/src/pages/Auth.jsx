import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, supabase } from '../services/supabase'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signup') // 'signup' | 'login'
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/search', { replace: true })
    })
  }, [navigate])

  const handleGoogle = async () => {
    setError(null)
    await signInWithGoogle()
  }

  const handleApple = async () => {
    setError(null)
    await signInWithApple()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fn = mode === 'signup'
      ? () => signUpWithEmail(email, password, fullName)
      : () => signInWithEmail(email, password)

    const { error: authError } = await fn()

    if (authError) {
      setError(authError.message)
    } else {
      navigate('/search', { replace: true })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-[#0A0A0F]">

      {/* ── Left — form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12 max-w-lg mx-auto w-full">

        {/* Logo */}
        <div className="mb-10 flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Unmapped Logo" className="h-10 object-contain" />
        </div>

        <h1 className="text-3xl font-bold text-[#F0ECE8] mb-2">Start your journey</h1>
        <p className="text-[#8A7A72] text-sm mb-8">
          Discover destinations you never knew existed.
        </p>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={handleGoogle}
            className="flex items-center justify-center gap-3 w-full px-5 py-3 rounded-xl bg-[#0F0D12] border border-[#1E1B25] text-[#F0ECE8] text-sm font-medium hover:border-rose-gold/40 transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            onClick={handleApple}
            className="flex items-center justify-center gap-3 w-full px-5 py-3 rounded-xl bg-[#0F0D12] border border-[#1E1B25] text-[#F0ECE8] text-sm font-medium hover:border-rose-gold/40 transition-colors"
          >
            <AppleIcon />
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[#1E1B25]" />
          <span className="text-xs text-[#8A7A72]">or</span>
          <div className="flex-1 h-px bg-[#1E1B25]" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs text-[#8A7A72] mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="input-dark"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-[#8A7A72] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-dark"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#8A7A72] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-dark"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-sm text-[#8A7A72] text-center mt-6">
          {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(null) }}
            className="text-rose-gold hover:underline font-medium"
          >
            {mode === 'signup' ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>

      {/* ── Right — atmospheric panel ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-end">
        {/* Background */}
        <div className="absolute inset-0 bg-[#0F0D12]" />
        {/* Dot-grid */}
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
        {/* Rose-gold gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-gold/20 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] glow-rose pointer-events-none" />

        {/* Quote */}
        <div className="relative z-10 p-12 max-w-sm">
          <div className="text-3xl text-rose-gold font-serif mb-4 select-none">"</div>
          <p className="text-[#F0ECE8] text-base leading-relaxed italic font-light">
            Quit your job, book the flight, figure it out when you get there.
            The world is smaller than you think.
          </p>
          <p className="mt-4 text-sm text-[#8A7A72]">
            <span className="text-rose-gold">u/perpetualmotion</span> · r/solotravel
          </p>
        </div>
      </div>

    </div>
  )
}
