import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FocusMeter from './FocusMeter.jsx'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('emily.ui', JSON.stringify({ effects: 'minimal', onboarded: true }))
})

describe('FocusMeter', () => {
  it('opens the weekly reflection from its "Your week" button', async () => {
    render(<FocusMeter />)
    fireEvent.click(screen.getByRole('button', { name: /your week/i }))
    // The panel is lazy-loaded behind Suspense, so wait for it to resolve.
    expect(await screen.findByRole('dialog', { name: /your week/i })).toBeInTheDocument()
  })
})
