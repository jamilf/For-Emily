import { describe, it, expect, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import useScrollLock from './useScrollLock.js'

function Locker({ active = true }) {
  useScrollLock(active)
  return <div>locked</div>
}

afterEach(() => {
  // Ensure a clean body between tests regardless of lock state.
  document.body.style.cssText = ''
})

describe('useScrollLock', () => {
  it('pins the body on mount and fully restores on unmount', () => {
    expect(document.body.style.position).toBe('')
    const { unmount } = render(<Locker />)
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.overscrollBehavior).toBe('contain')
    unmount()
    expect(document.body.style.position).toBe('')
    expect(document.body.style.overflow).toBe('')
  })

  it('does nothing when inactive', () => {
    render(<Locker active={false} />)
    expect(document.body.style.position).toBe('')
  })

  it('ref-counts so it only unlocks when the last overlay closes', () => {
    const a = render(<Locker />)
    const b = render(<Locker />)
    expect(document.body.style.position).toBe('fixed')
    a.unmount() // one still open
    expect(document.body.style.position).toBe('fixed')
    b.unmount() // last one closes
    expect(document.body.style.position).toBe('')
  })
})
