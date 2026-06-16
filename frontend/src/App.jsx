import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useTripStore from './store/tripStore'
import { supabase } from './services/supabase'

import Landing from './pages/Landing'
import Auth    from './pages/Auth'
import Search  from './pages/Search'
import Plan    from './pages/Plan'
import Confirm from './pages/Confirm'

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking')
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'ok' : 'unauth')
    })
  }, [])

  if (status === 'checking') {
    return <div className="min-h-screen bg-[#0A0A0F]" />
  }
  if (status === 'unauth') {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }
  return children
}

export default function App() {
  const { darkMode } = useTripStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <div className={darkMode ? 'bg-[#0A0A0F] text-[#F0ECE8]' : 'bg-[#FDFAF8] text-gray-900'}>
      <Routes>
        <Route path="/"       element={<Landing />} />
        <Route path="/auth"   element={<Auth />} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/plan"   element={<ProtectedRoute><Plan /></ProtectedRoute>} />
        <Route path="/confirm" element={<ProtectedRoute><Confirm /></ProtectedRoute>} />
        <Route path="*"       element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
