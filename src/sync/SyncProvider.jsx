import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getClient, SYNC_ENABLED } from './config.js'
import { CHANNEL } from '../hooks/useLocalStorage.js'
import { isSyncKey, isSuppressed, stampKey, syncOnce } from './syncEngine.js'

const SyncContext = createContext(null)
export function useSync() {
  return useContext(SyncContext)
}

/**
 * Wires email-code auth + automatic cloud sync around the app. Logged out, the
 * app is unchanged (pure local). Logged in: pulls/merges on login, on tab focus,
 * and pushes (debounced) whenever a synced key changes locally. All network is
 * guarded so going offline silently falls back to local-only.
 */
export default function SyncProvider({ children }) {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('signedOut') // signedOut | syncing | synced | offline | error
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const clientRef = useRef(null)
  const pushTimer = useRef(null)

  const userId = session?.user?.id || null
  const email = session?.user?.email || null
  const initedRef = useRef(false)
  const subRef = useRef(null)

  // Lazily load the SDK, restore the session, and subscribe — once. Called on
  // boot only if a session is already stored, and otherwise on first sign-in,
  // so logged-out visitors never download the Supabase chunk.
  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current
    const client = await getClient()
    if (!client) return null
    clientRef.current = client
    if (!initedRef.current) {
      initedRef.current = true
      const { data } = await client.auth.getSession()
      setSession(data.session || null)
      subRef.current = client.auth.onAuthStateChange((_event, s) => setSession(s)).data.subscription
    }
    return client
  }, [])

  useEffect(() => {
    if (!SYNC_ENABLED) return undefined
    let hasStoredSession = false
    try {
      hasStoredSession = !!localStorage.getItem('emily.auth')
    } catch {
      hasStoredSession = false
    }
    if (hasStoredSession) ensureClient()
    return () => subRef.current?.unsubscribe?.()
  }, [ensureClient])

  const doSync = useCallback(async () => {
    const client = clientRef.current
    if (!client || !userId) return
    setStatus('syncing')
    try {
      const t = await syncOnce(client, userId)
      setLastSyncedAt(t)
      setStatus('synced')
    } catch {
      setStatus(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error')
    }
  }, [userId])

  // Sync on login (and clear status on logout).
  useEffect(() => {
    if (userId) doSync()
    else setStatus('signedOut')
  }, [userId, doSync])

  // Push local changes (debounced) and pull when the tab regains focus.
  useEffect(() => {
    if (!userId) return
    const schedulePush = () => {
      clearTimeout(pushTimer.current)
      pushTimer.current = setTimeout(doSync, 1500)
    }
    const onChange = (e) => {
      const key = e.detail?.key
      if (!key || !isSyncKey(key) || isSuppressed(key)) return
      stampKey(key)
      schedulePush()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') doSync()
    }
    window.addEventListener(CHANNEL, onChange)
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(pushTimer.current)
      window.removeEventListener(CHANNEL, onChange)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, doSync])

  const sendCode = useCallback(
    async (addr) => {
      const client = await ensureClient()
      if (!client) throw new Error('Sync is unavailable.')
      const { error } = await client.auth.signInWithOtp({ email: addr, options: { shouldCreateUser: true } })
      if (error) throw error
    },
    [ensureClient],
  )

  const verifyCode = useCallback(
    async (addr, token) => {
      const client = await ensureClient()
      if (!client) throw new Error('Sync is unavailable.')
      const { error } = await client.auth.verifyOtp({ email: addr, token: token.trim(), type: 'email' })
      if (error) throw error
    },
    [ensureClient],
  )

  const signOut = useCallback(async () => {
    await clientRef.current?.auth?.signOut()
    setSession(null)
    setStatus('signedOut')
    setLastSyncedAt(null)
  }, [])

  const value = {
    available: SYNC_ENABLED,
    signedIn: !!userId,
    email,
    status,
    lastSyncedAt,
    sendCode,
    verifyCode,
    signOut,
    syncNow: doSync,
  }
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}
