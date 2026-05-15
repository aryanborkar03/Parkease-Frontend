import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DriverLayout from '../../components/driver/DriverLayout'

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
  getUserName: () => 'Jane Driver',
  getEmail:    () => 'jane@example.com',
  getRole:     () => 'DRIVER',
  api: {
    get: vi.fn().mockResolvedValue({ unreadCount: 3 }),
  },
}))

// Tests
describe('DriverLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title in the topbar', () => {
    render(<DriverLayout title="My Dashboard" />)
    expect(screen.getByText('My Dashboard')).toBeInTheDocument()
  })

  it('renders the subtitle when provided', () => {
    render(<DriverLayout title="T" subtitle="Driver overview" />)
    expect(screen.getByText('Driver overview')).toBeInTheDocument()
  })

  it('renders Driver Menu sidebar label', () => {
    render(<DriverLayout title="T" />)
    expect(screen.getByText('Driver Menu')).toBeInTheDocument()
  })

  it('renders all driver nav items', () => {
    render(<DriverLayout title="T" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Find Parking')).toBeInTheDocument()
    expect(screen.getByText('My Bookings')).toBeInTheDocument()
    expect(screen.getByText('My Vehicles')).toBeInTheDocument()
    expect(screen.getByText('My Receipts')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('renders children inside page-content', () => {
    render(<DriverLayout title="T"><p>Driver child</p></DriverLayout>)
    expect(screen.getByText('Driver child')).toBeInTheDocument()
  })

  it('renders topbarRight slot', () => {
    render(<DriverLayout title="T" topbarRight={<button>Refresh</button>} />)
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
  })

  it('renders user name from mocked api helper', () => {
    render(<DriverLayout title="T" />)
    expect(screen.getByText('Jane Driver')).toBeInTheDocument()
  })

  it('toggles sidebar open on hamburger click', async () => {
    const { container } = render(<DriverLayout title="T" />)
    expect(container.querySelector('.sidebar-open')).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Open menu'))
    expect(container.querySelector('.sidebar-open')).toBeInTheDocument()
  })
})
