import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import GroveHub from './GroveHub.jsx'

describe('GroveHub', () => {
  it('renders an accessible launcher listing every world surface', () => {
    render(<GroveHub onClose={() => {}} onOpen={() => {}} />)
    expect(screen.getByRole('dialog', { name: /the grove/i })).toBeInTheDocument()
    for (const name of [
      'Open Grove Story',
      'Open Grove Almanac',
      'Open Forest Spirits',
      'Open Memory Grove',
      'Open Sanctuary Seasons',
      'Open Scene Themes',
      'Open Constellations',
      'Open Journal',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('closes the hub and opens the chosen surface', () => {
    const onClose = vi.fn()
    const onOpen = vi.fn()
    render(<GroveHub onClose={onClose} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open Sanctuary Seasons' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledWith('seasons')
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<GroveHub onClose={onClose} onOpen={() => {}} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<GroveHub onClose={() => {}} onOpen={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
