import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ManagerLayout from '../../components/manager/ManagerLayout'

// Mocks
vi.mock('react-router-dom', () => ({
  NavLink: ({ to, children, className }) => {
    const cls = typeof className === 'function' ? className({ isActive: false }) : className
    return <a href={to} className={cls}>{children}</a>
  },
  useNavigate: () => vi.fn(),
}))

vi.mock('../../utils/api', () => ({
  clearAuth:   vi.fn(),
  getUserName: () => 'Manager User',
  getEmail:    () => 'manager@example.com',
  getRole:     () => 'LOT_MANAGER',
}))

// Tests
describe('ManagerLayout', () => {
  it('renders the page title in the topbar', () => {
    render(<ManagerLayout title="Manager Dashboard" />)
    expect(screen.getByText('Manager Dashboard')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<ManagerLayout title="T" subtitle="Manage your lots" />)
    expect(screen.getByText('Manage your lots')).toBeInTheDocument()
  })

  it('renders the Manager Menu sidebar label', () => {
    render(<ManagerLayout title="T" />)
    expect(screen.getByText('Manager Menu')).toBeInTheDocument()
  })

  it('renders manager nav items in the sidebar', () => {
    render(<ManagerLayout title="T" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('My Lots')).toBeInTheDocument()
  })

  it('renders children inside page-content', () => {
    render(<ManagerLayout title="T"><span>Manager child</span></ManagerLayout>)
    expect(screen.getByText('Manager child')).toBeInTheDocument()
  })

  it('renders topbarRight slot when provided', () => {
    render(<ManagerLayout title="T" topbarRight={<button>New Lot</button>} />)
    expect(screen.getByRole('button', { name: 'New Lot' })).toBeInTheDocument()
  })

  it('shows Lot Manager role label from api mock', () => {
    render(<ManagerLayout title="T" />)
    expect(screen.getByText('Lot Manager')).toBeInTheDocument()
  })

  it('toggles sidebar open on hamburger click', async () => {
    const { container } = render(<ManagerLayout title="T" />)
    expect(container.querySelector('.sidebar-open')).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Open menu'))
    expect(container.querySelector('.sidebar-open')).toBeInTheDocument()
  })
})
