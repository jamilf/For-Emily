import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import ReflectionModal from './ReflectionModal.jsx'

const noop = () => {}
function renderModal(props = {}) {
  return render(<ReflectionModal note="" onNoteChange={noop} onSaveMood={noop} onClose={noop} {...props} />)
}

describe('ReflectionModal', () => {
  it('renders the mood check-in', () => {
    renderModal()
    expect(screen.getByRole('dialog', { name: /session reflection/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Great' })).toBeInTheDocument()
  })

  it('offers a recall bridge when cards are due, and fires the callback', () => {
    const onReviewCards = vi.fn()
    renderModal({ reviewDue: 4, onReviewCards })
    const btn = screen.getByRole('button', { name: /review 4 cards/i })
    fireEvent.click(btn)
    expect(onReviewCards).toHaveBeenCalledTimes(1)
  })

  it('hides the recall bridge when nothing is due', () => {
    renderModal({ reviewDue: 0, onReviewCards: () => {} })
    expect(screen.queryByRole('button', { name: /review .* card/i })).toBeNull()
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = renderModal({ reviewDue: 3, onReviewCards: () => {} })
    expect(await axe(container)).toHaveNoViolations()
  })
})
