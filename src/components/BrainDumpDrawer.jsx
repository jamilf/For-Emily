import { useEffect, useRef, useState } from 'react'
import Drawer from './Drawer.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'

/**
 * Feature 4 — Brain Dump Pad. A quiet place to offload intrusive thoughts.
 * Auto-saves (debounced) to emily.brainDump and restores on open. Never blocks
 * or interrupts a focus session.
 */
export default function BrainDumpDrawer({ onClose }) {
  const [saved, setSaved] = usePersistedState('emily.brainDump', '')
  const [text, setText] = useState(saved)
  const [status, setStatus] = useState('Saved')
  const timer = useRef(null)

  // Debounced persistence — keeps writes off the keystroke path.
  useEffect(() => {
    if (text === saved) return
    setStatus('Saving…')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setSaved(text)
      setStatus('Saved')
    }, 400)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <Drawer open onClose={onClose} title="🧠 Brain Dump" className="zen-hide">
      <p className="mb-2 text-xs text-brown/60">
        Park any stray thought here so it stops tugging at you. It saves itself.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        aria-label="Brain dump notes"
        placeholder="Let it out…"
        className="w-full resize-none rounded-xl border-2 border-brown/20 bg-white/70 p-3 text-sm leading-relaxed focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
      />
      <p className="mt-1 text-right text-xs text-brown/50" aria-live="polite">
        {status}
      </p>
    </Drawer>
  )
}
