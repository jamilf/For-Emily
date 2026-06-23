import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'vitest-axe'
import ThemesModal from './ThemesModal.jsx'

function seedTrees(n) {
  localStorage.setItem(
    'emily.garden',
    JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: 0, ts: Date.now() - i * 3600000 }))),
  )
}
const readThemes = () => JSON.parse(localStorage.getItem('emily.themes'))
const liFor = (name) => screen.getByText(name).closest('li')

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('ThemesModal', () => {
  it('renders an accessible dialog listing every theme', () => {
    render(<ThemesModal onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /scene themes/i })).toBeInTheDocument()
    for (const name of ['Grove', 'Sakura', 'Embers', 'Aurora', 'Moonlit', 'Golden Hour']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('marks the active theme in text (default Grove), not colour alone', () => {
    render(<ThemesModal onClose={() => {}} />)
    expect(liFor('Grove')).toHaveTextContent(/Active/)
    expect(liFor('Sakura')).not.toHaveTextContent(/Active/)
  })

  it('gently gates a locked theme with its threshold and no Use button', () => {
    seedTrees(5) // sakura (5) unlocked; embers (12) still locked
    render(<ThemesModal onClose={() => {}} />)
    expect(liFor('Embers')).toHaveTextContent(/opens at 12 trees/i)
    expect(within(liFor('Embers')).queryByRole('button')).toBeNull()
  })

  it('selecting an unlocked theme persists it and moves the active marker', () => {
    seedTrees(5)
    render(<ThemesModal onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /use the sakura theme/i }))
    expect(readThemes().selected).toBe('sakura')
    expect(liFor('Sakura')).toHaveTextContent(/Active/)
    expect(liFor('Grove')).not.toHaveTextContent(/Active/)
  })

  it('reconciles on open and celebrates a freshly unlocked sky', () => {
    seedTrees(5) // crosses the Sakura threshold for the first time
    render(<ThemesModal onClose={() => {}} />)
    expect(screen.getByText(/a new sky opened/i)).toBeInTheDocument()
    expect(readThemes().unlocked.sakura).toBeTruthy()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<ThemesModal onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has no axe-detectable accessibility violations', async () => {
    seedTrees(12)
    const { container } = render(<ThemesModal onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
