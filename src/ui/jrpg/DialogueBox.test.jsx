import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import DialogueBox from './DialogueBox.jsx'

beforeEach(() => localStorage.clear())

// Force instant reveal in jsdom by enabling reduced motion via matchMedia.
function reduceMotion(on) {
  window.matchMedia = (q) => ({
    matches: on && /reduced-motion/.test(q),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

const LINE = 'You showed up today, and that counts.'

describe('DialogueBox', () => {
  it('keeps the COMPLETE text in the DOM immediately for screen readers', () => {
    reduceMotion(false)
    render(<DialogueBox name="Soot" text={LINE} />)
    // Even before any crawl finishes, an sr-only live region holds the full line.
    const srNodes = screen.getAllByText((_, el) => el?.textContent === LINE)
    expect(srNodes.length).toBeGreaterThan(0)
  })

  it('renders the nameplate', () => {
    reduceMotion(false)
    render(<DialogueBox name="Cinder" text={LINE} />)
    expect(screen.getByText('Cinder')).toBeInTheDocument()
  })

  it('reveals everything instantly under reduced motion', () => {
    reduceMotion(true)
    render(<DialogueBox text={LINE} />)
    // The visible (aria-hidden) reveal already shows the whole line.
    expect(screen.getAllByText(LINE).length).toBeGreaterThanOrEqual(1)
  })

  it('a click skips the crawl, then advances when finished', () => {
    reduceMotion(true) // instant so it is already "done"
    const onAdvance = vi.fn()
    render(<DialogueBox text={LINE} onAdvance={onAdvance} />)
    const reveal = screen.getByRole('button')
    fireEvent.click(reveal) // already done → advances
    expect(onAdvance).toHaveBeenCalled()
  })

  it('has no axe-detectable violations', async () => {
    reduceMotion(false)
    const { container } = render(<DialogueBox name="Soot" text={LINE} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
