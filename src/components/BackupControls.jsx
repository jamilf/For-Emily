import { useRef, useState } from 'react'
import { exportAll, importAll } from '../storage/StorageManager.js'
import { dayStr } from '../utils/day.js'

/**
 * "Sanctuary backup" — download every bit of saved progress as a JSON file, or
 * restore it on a new device / after clearing the browser. This is the
 * no-data-loss safety net that works even when signed out of cloud sync.
 */
export default function BackupControls() {
  const fileRef = useRef(null)
  const [status, setStatus] = useState('')

  function download() {
    try {
      const backup = exportAll()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sanctuary-backup-${dayStr()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus('Backup downloaded. Keep it somewhere safe. ✓')
    } catch {
      setStatus('Could not create a backup just now.')
    }
  }

  async function restore(e) {
    const file = e.target.files?.[0]
    if (!file) return
    let parsed
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setStatus('That file isn’t valid JSON and could not be restored.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    try {
      // importAll validates first and only writes recognised keys, so a bad file
      // can never partially corrupt existing progress.
      const count = importAll(parsed)
      setStatus(`Restored ${count} item${count === 1 ? '' : 's'}. Your sanctuary is back. ✓`)
    } catch (err) {
      setStatus(err?.message || 'That file could not be restored.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="rounded-xl border-2 border-brown/15 bg-white/50 p-4">
      <h3 className="font-display text-base text-brown">Sanctuary backup</h3>
      <p className="mt-1 text-sm leading-relaxed text-brown/70">
        Save everything — decks, garden, stats, kept letters — to a file you can keep, or restore it on
        another device. Works even when you&apos;re signed out.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          className="rounded-2xl bg-brown px-4 py-2 font-display text-sm text-cream transition-colors hover:bg-brownDark active:scale-95"
        >
          Download backup
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-2xl bg-brown/10 px-4 py-2 font-display text-sm text-brown transition-colors hover:bg-brown/20 active:scale-95"
        >
          Restore from file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          aria-label="Restore Sanctuary backup file"
          onChange={restore}
          className="hidden"
        />
      </div>
      {status && (
        <p className="mt-2 text-xs text-brown/70" aria-live="polite">
          {status}
        </p>
      )}
    </div>
  )
}
