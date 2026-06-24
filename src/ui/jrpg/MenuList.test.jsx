import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import MenuList from './MenuList.jsx'

beforeEach(() => localStorage.clear())

function items(onSelect = () => {}) {
  return [
    { key: 'a', label: 'Story', onSelect },
    { key: 'b', label: 'Almanac', onSelect },
    { key: 'c', label: 'Journal', onSelect },
  ]
}

describe('MenuList', () => {
  it('renders every option as a real, tappable button', () => {
    render(<MenuList ariaLabel="Grove" items={items()} />)
    expect(screen.getByRole('button', { name: /story/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /almanac/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /journal/i })).toBeInTheDocument()
  })

  it('selects on click (direct tap path)', () => {
    const onSelect = vi.fn()
    render(<MenuList ariaLabel="Grove" items={items(onSelect)} />)
    fireEvent.click(screen.getByRole('button', { name: /almanac/i }))
    expect(onSelect).toHaveBeenCalled()
  })

  it('ArrowDown moves focus to the next option (keyboard augmentation)', () => {
    render(<MenuList ariaLabel="Grove" items={items()} />)
    const first = screen.getByRole('button', { name: /story/i })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(screen.getByRole('button', { name: /almanac/i })).toHaveFocus()
  })

  it('ArrowUp wraps from the first to the last option', () => {
    render(<MenuList ariaLabel="Grove" items={items()} />)
    const first = screen.getByRole('button', { name: /story/i })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowUp' })
    expect(screen.getByRole('button', { name: /journal/i })).toHaveFocus()
  })

  it('has no axe-detectable violations', async () => {
    const { container } = render(<MenuList ariaLabel="Grove menu" items={items()} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
