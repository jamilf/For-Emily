import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BackupControls from './BackupControls.jsx'

beforeEach(() => localStorage.clear())

describe('BackupControls', () => {
  it('renders download + restore controls', () => {
    render(<BackupControls />)
    expect(screen.getByRole('button', { name: /download backup/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /restore from file/i })).toBeInTheDocument()
  })

  it('restores emily.* data from an uploaded backup file', async () => {
    render(<BackupControls />)
    const backup = JSON.stringify({
      app: 'emilys-study-sanctuary',
      data: { 'emily.brainDump': 'restored note' },
    })
    const file = new File([backup], 'sanctuary-backup.json', { type: 'application/json' })
    const input = screen.getByLabelText(/restore sanctuary backup file/i)
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByText(/restored 1 item/i)).toBeInTheDocument())
    expect(JSON.parse(localStorage.getItem('emily.brainDump'))).toBe('restored note')
  })

  it('shows a friendly message for an invalid backup file', async () => {
    render(<BackupControls />)
    const file = new File(['not json at all'], 'bad.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText(/restore sanctuary backup file/i), {
      target: { files: [file] },
    })
    await waitFor(() =>
      expect(screen.getByText(/could not be restored|not a sanctuary backup/i)).toBeInTheDocument(),
    )
  })
})
