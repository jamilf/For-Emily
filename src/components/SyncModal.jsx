import { useRef, useState } from 'react'
import useFocusTrap from '../hooks/useFocusTrap.js'
import { useSync } from '../sync/SyncProvider.jsx'

function timeAgo(ts) {
  if (!ts) return null
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  return new Date(ts).toLocaleDateString()
}

/**
 * Sync panel — email one-time-code sign in, then automatic cross-device sync.
 * Logged out, nothing syncs (the app stays purely local). Reuses the shared
 * modal chrome; Esc / backdrop closes.
 */
export default function SyncModal({ onClose }) {
  const sync = useSync()
  const [step, setStep] = useState('email') // email | code
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

  const input =
    'w-full rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2.5 text-sm focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow'
  const primary =
    'w-full rounded-2xl bg-brown px-4 py-3 font-display text-cream transition-colors hover:bg-brownDark active:scale-95 disabled:opacity-50'

  async function handleSend(e) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError('')
    try {
      await sync.sendCode(email.trim())
      setStep('code')
    } catch (err) {
      setError(err?.message || 'Could not send the code. Check the email and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    setError('')
    try {
      await sync.verifyCode(email.trim(), code)
      // onAuthStateChange flips signedIn; the logged-in view renders below.
      setCode('')
    } catch (err) {
      setError(err?.message || 'That code did not work. Double-check it or send a new one.')
    } finally {
      setBusy(false)
    }
  }

  const statusLine =
    {
      syncing: 'Syncing…',
      synced: sync?.lastSyncedAt ? `Synced ${timeAgo(sync.lastSyncedAt)}` : 'Synced',
      offline: 'Offline. Saved on this device, will sync when you reconnect.',
      error: 'Could not reach the cloud just now. Your progress is safe on this device.',
      signedOut: '',
    }[sync?.status] || ''

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center modal-overlay-pad">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bgDim/75 sm:backdrop-blur-sm"
      />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sync your progress"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            ☁ Sync your progress
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close sync"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90"
          >
            ✕
          </button>
        </div>

        <div className="paper-grain overflow-y-auto bg-cream p-6 text-brownDark">
          {!sync?.available ? (
            <p className="text-sm text-brown/80">
              Sync isn’t configured in this build, but your progress is still saved on this device.
            </p>
          ) : sync.signedIn ? (
            // ── Signed in ────────────────────────────────────────────────
            <div className="space-y-4 text-center">
              <p className="font-display text-lg text-brown">You’re synced ☁️</p>
              <p className="text-sm text-brown/80">
                Signed in as <span className="font-display">{sync.email}</span>. Your progress now follows you
                to any device you sign in on with this email.
              </p>
              <p className="text-xs text-brown/60" aria-live="polite">
                {statusLine}
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={sync.syncNow}
                  disabled={sync.status === 'syncing'}
                  className="rounded-2xl bg-brown px-5 py-2.5 font-display text-cream transition-colors hover:bg-brownDark active:scale-95 disabled:opacity-50"
                >
                  Sync now
                </button>
                <button
                  onClick={sync.signOut}
                  className="rounded-2xl bg-brown/10 px-5 py-2.5 font-display text-brown transition-colors hover:bg-brown/20 active:scale-95"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : step === 'email' ? (
            // ── Email step ───────────────────────────────────────────────
            <form onSubmit={handleSend} className="space-y-3">
              <p className="text-sm text-brown/80">
                Sign in with your email to keep your flashcards, garden, stats, and letters in sync across
                your phone and laptop. We’ll email you a 6-digit code, no password.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                autoComplete="email"
                className={input}
              />
              {error && (
                <p className="text-sm text-ever-red" aria-live="assertive">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy} className={primary}>
                {busy ? 'Sending…' : 'Email me a code'}
              </button>
              <p className="text-center text-xs text-brown/50">
                Your data is private to your account and never shared.
              </p>
            </form>
          ) : (
            // ── Code step ────────────────────────────────────────────────
            <form onSubmit={handleVerify} className="space-y-3">
              <p className="text-sm text-brown/80">
                Enter the 6-digit code we sent to <span className="font-display">{email}</span>.
              </p>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                autoFocus
                className={`${input} text-center font-display text-lg tracking-[0.3em]`}
              />
              {error && (
                <p className="text-sm text-ever-red" aria-live="assertive">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy} className={primary}>
                {busy ? 'Verifying…' : 'Verify & sync'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setError('')
                }}
                className="w-full text-center font-display text-xs text-brown/60 underline-offset-2 hover:underline"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
