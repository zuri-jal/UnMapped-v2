import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Unmapped] Supabase env vars not set — auth features will not work.')
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '')

/**
 * Sign up a new user with email and password.
 * Supabase sends a confirmation email — user must verify before signing in.
 * @returns {{ data, error }}
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

/**
 * Sign in an existing user with email and password.
 * @returns {{ data: { user, session }, error }}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

/**
 * Sign in via Google OAuth (configured in Supabase Dashboard → Auth → Providers).
 * Redirects the browser to Google; Supabase handles the callback and creates a session.
 * @returns {{ data, error }}
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/plan` },
  })
  return { data, error }
}

/**
 * Sign out the currently authenticated user and clear the local session.
 * @returns {{ error }}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get the currently authenticated user from the active session.
 * Returns null if the user is not signed in.
 * @returns {Promise<User|null>}
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Subscribe to auth state changes — call once at app root (e.g. in App.jsx useEffect).
 * The callback receives (event, session) where event is one of:
 * SIGNED_IN | SIGNED_OUT | TOKEN_REFRESHED | PASSWORD_RECOVERY | USER_UPDATED
 * @param {Function} callback
 * @returns {{ data: { subscription } }} — call subscription.unsubscribe() on cleanup
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
