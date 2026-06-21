import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import MemoryGroveModal from './MemoryGroveModal.jsx'

// Two harvested trees; the first (dna 0 = "First Sprout") is already dedicated.
function seed() {
  localStorage.setItem(
    'emily.garden',
    JSON.stringify([
      { id: 0, ts: 1000 },
      { id: 1, ts: 2000 },
    ]),
  )
  localStorage.setItem(
    'emily.memories',
    JSON.stringify([{ id: 99, dna: 0, ts: 1000, title: 'Passed exam', note: 'biology final' }]),
  )
}

beforeEach(() => {
  localStorage.clear()
  seed()
})
afterEach(() => localStorage.clear())

describe('MemoryGroveModal', () => {
  it('renders as an accessible dialog listing dedicated memories with species + note', () => {
    render(<MemoryGroveModal onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /memory grove/i })).toBeInTheDocument()
    expect(screen.getByText('Passed exam')).toBeInTheDocument()
    expect(screen.getByText('biology final')).toBeInTheDocument()
    expect(screen.getByText(/First Sprout · grown/i)).toBeInTheDocument()
  })

  it('filters the list by search query (case-insensitive)', () => {
    render(<MemoryGroveModal onClose={() => {}} />)
    const search = screen.getByRole('textbox', { name: /search memories/i })
    fireEvent.change(search, { target: { value: 'EXAM' } })
    expect(screen.getByText('Passed exam')).toBeInTheDocument()
    fireEvent.change(search, { target: { value: 'zzz' } })
    expect(screen.queryByText('Passed exam')).not.toBeInTheDocument()
    expect(screen.getByText(/no memories match/i)).toBeInTheDocument()
  })

  it('dedicates an undedicated tree through the pick → form flow', () => {
    render(<MemoryGroveModal onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /dedicate a tree/i }))
    // Only the undedicated tree (dna 1 = "Quiet Pine") is offered.
    fireEvent.click(screen.getByRole('button', { name: /dedicate the quiet pine/i }))
    const title = screen.getByLabelText('Title')
    fireEvent.change(title, { target: { value: 'Finished the project' } })
    fireEvent.click(screen.getByRole('button', { name: /dedicate this tree/i }))
    // Back on the list with both memories.
    expect(screen.getByText('Finished the project')).toBeInTheDocument()
    expect(screen.getByText(/2 memories kept/i)).toBeInTheDocument()
  })

  it('edits a memory in place', () => {
    render(<MemoryGroveModal onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /edit memory passed exam/i }))
    const title = screen.getByLabelText('Title')
    expect(title).toHaveValue('Passed exam')
    fireEvent.change(title, { target: { value: 'Passed the final' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    expect(screen.getByText('Passed the final')).toBeInTheDocument()
    expect(screen.queryByText('Passed exam')).not.toBeInTheDocument()
  })

  it('deletes a memory after an inline confirm', () => {
    render(<MemoryGroveModal onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /delete memory passed exam/i }))
    expect(screen.getByText(/remove this memory/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.queryByText('Passed exam')).not.toBeInTheDocument()
  })

  it('renders a tree sprite (shared ProceduralTree) for each memory', () => {
    const { container } = render(<MemoryGroveModal onClose={() => {}} />)
    // ProceduralTree → PixelSprite renders a decorative `.pixelated` box-shadow grid.
    expect(container.querySelectorAll('.pixelated').length).toBeGreaterThanOrEqual(1)
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<MemoryGroveModal onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<MemoryGroveModal onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
