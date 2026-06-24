import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import SceneTransition from './SceneTransition.jsx'

describe('SceneTransition', () => {
  it('renders nothing before it is triggered (no overlay on first paint)', () => {
    const { container } = render(<SceneTransition trigger={0} />)
    expect(container.querySelector('.jrpg-wipe')).toBeNull()
  })

  it('renders a non-blocking, decorative wipe when triggered', () => {
    const { container } = render(<SceneTransition trigger={1} />)
    const wipe = container.querySelector('.jrpg-wipe')
    expect(wipe).not.toBeNull()
    // Never captures input and is hidden from assistive tech.
    expect(wipe).toHaveClass('pointer-events-none')
    expect(wipe).toHaveAttribute('aria-hidden', 'true')
  })
})
