import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AdminLayout from '../../components/admin/AdminLayout'

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
  getUserName: () => 'Admin User',
  getEmail:    () => 'admin@example.com',
  getRole:     () => 'ADMIN',
}))

// Tests
describe('AdminLayout', () => {
  it('renders the page title in the topbar', () => {
    render(<AdminLayout title="Admin Dashboard" />)
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('renders the subtitle in the topbar when provided', () => {
    render(<AdminLayout title="T" subtitle="Welcome, Admin" />)
    expect(screen.getByText('Welcome, Admin')).toBeInTheDocument()
  })

  it('renders the Admin Panel sidebar label', () => {
    render(<AdminLayout title="T" />)
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
  })

  it('renders all admin nav items in the sidebar', () => {
    render(<AdminLayout title="T" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Lots')).toBeInTheDocument()
    expect(screen.getByText('Bookings')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('renders children inside page-content', () => {
    render(<AdminLayout title="T"><p>Child content</p></AdminLayout>)
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders topbarRight content when provided', () => {
    render(<AdminLayout title="T" topbarRight={<button>Export</button>} />)
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
  })

  it('toggles sidebar open when hamburger is clicked', async () => {
    const { container } = render(<AdminLayout title="T" />)
    // Verify sidebar is initially closed
    expect(container.querySelector('.sidebar-open')).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Open menu'))
    expect(container.querySelector('.sidebar-open')).toBeInTheDocument()
  })
})
