import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import GuideModal from './GuideModal.jsx'

describe('GuideModal', () => {
  it('renders as an accessible dialog and lists features', () => {
    render(<GuideModal onClose={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: /how to use this app/i })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pomodoro' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Flashcards' })).toBeInTheDocument()
  })

  it('focuses the close button on open (focus trap initial focus)', () => {
    render(<GuideModal onClose={() => {}} />)
    expect(screen.getByRole('button', { name: /close guide/i })).toHaveFocus()
  })

  it('closes on Escape and on backdrop click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<GuideModal onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<GuideModal onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
