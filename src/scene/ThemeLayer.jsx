import { useMemo } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import { activeTheme } from '../data/themes.js'

/**
 * Decorative scene-theme overlay — a single bottom-weighted tint drawn from the
 * active theme's colour, plus a faint accent glow low on the horizon. Purely
 * cosmetic (aria-hidden, pointer-events-none) and sits BEHIND the opaque content at
 * z-[1], so it never touches text contrast; transparent at the top to protect the
 * header. The default 'grove' theme is fully transparent, so this renders nothing
 * visible until Emily chooses a theme. Colours live only in themes.js, and the
 * background eases between themes (no motion to disable for reduced-motion users).
 */
export default function ThemeLayer() {
  const [themes] = usePersistedState('emily.themes', { selected: null, unlocked: {} })
  const [garden] = usePersistedState('emily.garden', [])
  const [stats] = usePersistedState('emily.stats', {})
  const [flashcardStats] = usePersistedState('emily.flashcardStats', {})
  const [reflections] = usePersistedState('emily.reflections', [])

  const theme = useMemo(
    () => activeTheme(themes, { garden, stats, flashcardStats, reflections }),
    [themes, garden, stats, flashcardStats, reflections],
  )

  return (
    <div aria-hidden="true" className="theme-layer pointer-events-none fixed inset-0 z-[1]">
      <div
        className="absolute inset-0 transition-[background] duration-1000"
        style={{ background: `linear-gradient(to top, ${theme.tint} 0%, transparent 60%)` }}
      />
      {theme.id !== 'grove' && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(120% 80% at 50% 100%, ${theme.accent}22 0%, transparent 65%)`,
          }}
        />
      )}
    </div>
  )
}
