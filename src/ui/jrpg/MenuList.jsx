import { useRef, useState } from 'react'
import useUiSound from '../../hooks/useUiSound.js'

/**
 * MenuList — a vertical option list with a pixel selection cursor that follows REAL
 * focus. Every item is a genuine button: reachable by direct tap and by Tab, and
 * activatable with Enter/Space. Arrow keys (Up/Down, Home/End) are an augmentation
 * that moves focus; the cursor (▸) only ever marks where focus already is, so there
 * is never a cursor-only dead end. A soft cursor blip plays when audio is enabled.
 *
 * @param {{ items: Array<{ key:string, label:React.ReactNode, onSelect?:()=>void,
 *   icon?:React.ReactNode, disabled?:boolean, hint?:React.ReactNode }>,
 *   ariaLabel:string, className?:string }} props
 */
export default function MenuList({ items, ariaLabel, className = '' }) {
  const [focusedKey, setFocusedKey] = useState(null)
  const refs = useRef({})
  const play = useUiSound()

  const enabled = items.filter((it) => !it.disabled)

  function focusByOffset(currentKey, delta) {
    const order = enabled.map((it) => it.key)
    const i = order.indexOf(currentKey)
    const next = order[(i + delta + order.length) % order.length]
    refs.current[next]?.focus()
  }

  function onKeyDown(e, item) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      play('cursor')
      focusByOffset(item.key, 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      play('cursor')
      focusByOffset(item.key, -1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      refs.current[enabled[0]?.key]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      refs.current[enabled[enabled.length - 1]?.key]?.focus()
    }
  }

  return (
    <ul aria-label={ariaLabel} className={`flex flex-col gap-1 ${className}`}>
      {items.map((item) => {
        const active = focusedKey === item.key
        return (
          <li key={item.key} className="relative">
            <button
              type="button"
              ref={(el) => (refs.current[item.key] = el)}
              disabled={item.disabled}
              aria-label={item.ariaLabel || undefined}
              onClick={() => {
                play('confirm')
                item.onSelect?.()
              }}
              onFocus={() => setFocusedKey(item.key)}
              onMouseEnter={() => setFocusedKey(item.key)}
              onKeyDown={(e) => onKeyDown(e, item)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left font-display text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ever-yellow disabled:opacity-40 ${
                active ? 'bg-jrpg-sel text-jrpg-text' : 'text-brown hover:bg-brown/10'
              }`}
            >
              {/* The pixel cursor: marks current focus, hidden from assistive tech. */}
              <span
                aria-hidden="true"
                className={`w-3 shrink-0 text-jrpg-cursor transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
              >
                ▸
              </span>
              {item.icon && (
                <span aria-hidden="true" className="shrink-0 text-base">
                  {item.icon}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{item.label}</span>
                {item.sublabel && (
                  <span className={`block text-xs ${active ? 'text-jrpg-text/80' : 'text-brown/60'}`}>
                    {item.sublabel}
                  </span>
                )}
              </span>
              {item.hint && <span className="shrink-0 text-xs text-brown/55">{item.hint}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
