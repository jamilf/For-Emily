import { useEffect, useMemo, useRef, useState } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import { groveMetrics } from '../data/grove.js'
import { THEMES, isThemeUnlocked, reconcileThemes, resolveTheme } from '../data/themes.js'
import GameWindow from '../ui/jrpg/GameWindow.jsx'

/**
 * Scene Themes — a small picker for the cosmetic skies Emily has unlocked as her
 * grove grew. A lazy, focus-trapped modal matching the app's overlay chrome.
 * Unlocked themes are selectable; the active one is marked in TEXT (✦ Active), never
 * colour alone; locked ones show a gentle "opens at N trees", never a penalty.
 * Opening reconciles sticky unlocks once and celebrates anything newly earned.
 */
export default function ThemesModal({ onClose }) {
  const [themes, setThemes] = usePersistedState('emily.themes', { selected: null, unlocked: {} })
  const [garden] = usePersistedState('emily.garden', [])
  const [stats] = usePersistedState('emily.stats', {})
  const [flashcardStats] = usePersistedState('emily.flashcardStats', {})
  const [reflections] = usePersistedState('emily.reflections', [])

  const metrics = useMemo(
    () => groveMetrics({ garden, stats, flashcardStats, reflections }),
    [garden, stats, flashcardStats, reflections],
  )

  // Reconcile sticky unlocks once on open; surface anything newly earned.
  const [celebrate, setCelebrate] = useState([])
  const reconciled = useRef(false)
  useEffect(() => {
    if (reconciled.current) return
    reconciled.current = true
    const { themes: next, newlyUnlocked } = reconcileThemes(themes, metrics)
    if (newlyUnlocked.length > 0) {
      setThemes(next)
      setCelebrate(newlyUnlocked)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeId = resolveTheme(themes, metrics).id
  const select = (id) => setThemes((s) => ({ ...s, selected: id }))

  return (
    <GameWindow
      modal
      title="🎨 Scene Themes"
      ariaLabel="Scene Themes"
      onClose={onClose}
      closeLabel="Close themes"
      widthClass="max-w-md"
      bodyClassName="space-y-4 overflow-y-auto p-5"
    >
      <p className="text-sm text-brown/75">
        New skies open as your grove grows. Wear whichever one feels like home today. You can change it
        whenever you like.
      </p>

      {celebrate.length > 0 && (
        <div
          className="rounded-2xl border-2 border-ever-green/40 bg-ever-green/15 p-3 text-center"
          aria-live="polite"
        >
          <p className="font-display text-brown">A new sky opened! ✨</p>
          <p className="mt-1 text-sm text-brown/75">
            {celebrate.map((t) => t.name).join(', ')}. Try it on whenever you like.
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {THEMES.map((t) => {
          const unlocked = isThemeUnlocked(t, themes)
          const isActive = t.id === activeId
          return (
            <li
              key={t.id}
              className={`rounded-2xl border-2 p-3 ${
                isActive ? 'border-brown/40 bg-white/80' : 'border-brown/15 bg-white/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-sm text-brown">
                    <span aria-hidden="true">{t.emoji} </span>
                    {t.name}
                    {isActive && <span className="ml-2 text-ever-green">✦ Active</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-brown/75">{t.blurb}</p>
                  {!unlocked && (
                    <p className="mt-1 text-xs text-brown/55">
                      Opens at {t.rule.n} {t.rule.n === 1 ? 'tree' : 'trees'}. Keep tending, in your own time.
                    </p>
                  )}
                </div>
                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => select(t.id)}
                    disabled={isActive}
                    aria-label={isActive ? `${t.name} is active` : `Use the ${t.name} theme`}
                    className="shrink-0 rounded-xl border-2 border-brown/20 px-3 py-1.5 font-display text-xs text-brown transition-colors hover:bg-brown/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow disabled:opacity-50"
                  >
                    {isActive ? 'Active' : 'Use'}
                  </button>
                ) : (
                  <span
                    aria-hidden="true"
                    className="shrink-0 rounded-xl border-2 border-brown/15 px-3 py-1.5 font-display text-xs text-brown/45"
                  >
                    🔒
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </GameWindow>
  )
}
