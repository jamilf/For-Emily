import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import StatusPanel, { StatGauge } from './StatusPanel.jsx'

describe('StatGauge — positive, never depleting', () => {
  it('exposes the value via role=meter and as text (not colour alone)', () => {
    render(<StatGauge label="Today" value={40} max={100} icon="🍃" />)
    const meter = screen.getByRole('meter', { name: /today/i })
    expect(meter).toHaveAttribute('aria-valuenow', '40')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
    expect(screen.getByText('40 / 100')).toBeInTheDocument()
  })

  it('clamps the fill between 0 and full (never negative / over-full)', () => {
    const { rerender } = render(<StatGauge label="x" value={-5} max={10} />)
    let fill = screen.getByRole('meter').firstChild
    expect(fill).toHaveStyle({ width: '0%' })
    rerender(<StatGauge label="x" value={50} max={10} />)
    fill = screen.getByRole('meter').firstChild
    expect(fill).toHaveStyle({ width: '100%' })
  })

  it('supports a custom value label', () => {
    render(<StatGauge label="Streak" value={3} max={7} valueText="3 days" />)
    expect(screen.getByText('3 days')).toBeInTheDocument()
  })

  it('has no axe violations inside a panel', async () => {
    const { container } = render(
      <StatusPanel title="Status">
        <StatGauge label="Focus" value={2} max={5} />
      </StatusPanel>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
