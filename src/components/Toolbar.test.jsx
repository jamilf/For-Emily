import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toolbar from './Toolbar.jsx'

// useSync returns null outside a provider, so the Sync chip simply hides here —
// exactly how these components behave before sync is configured.

describe('Toolbar (header quick actions)', () => {
  it('keeps every action label visible, not icon-only, at any width', () => {
    render(
      <Toolbar
        onToggleFocus={() => {}}
        onOpenFlashcards={() => {}}
        onOpenQuests={() => {}}
        onOpenGuide={() => {}}
      />,
    )
    for (const label of ['Focus', 'Flashcards', 'Quests', 'Guide']) {
      const el = screen.getByText(label)
      // The old chips hid labels below the sm breakpoint; the class must be gone.
      expect(el.className).not.toMatch(/hidden/)
    }
  })

  it('keeps comfortable touch targets on the chips', () => {
    render(<Toolbar onOpenGuide={() => {}} />)
    expect(screen.getByRole('button', { name: /how to use this app/i }).className).toMatch(/min-h-\[44px\]/)
  })

  it('surfaces the due count on the flashcards chip and routes the tap', () => {
    const onOpenFlashcards = vi.fn()
    render(<Toolbar onOpenFlashcards={onOpenFlashcards} dueCount={3} />)
    const btn = screen.getByRole('button', { name: /open flashcards/i })
    expect(btn).toHaveTextContent('3')
    fireEvent.click(btn)
    expect(onOpenFlashcards).toHaveBeenCalledTimes(1)
  })
})
