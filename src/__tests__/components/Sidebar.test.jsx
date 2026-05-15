import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Sidebar from '../../components/common/Sidebar'

// Mocks
const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  NavLink: ({ to, children, className, onClick }) => {
    const cls = typeof className === 'function' ? className({ isActive: false }) : className
    return (
      <a href={to} className={cls} onClick={onClick} data-testid={`navlink-${to}`}>
        {children}
      </a>
    )
  },
  useNavigate: () => mockNavigate,
}))

vi.mock('../../utils/api', () => ({
  clearAuth:   vi.fn(),
  getUserName: () => 'John Doe',
  getEmail:    () => 'john@example.com',
  getRole:     () => 'DRIVER',
}))

// Helpers
const defaultNav = [
  { label: 'Dashboard', path: '/driver',   exact: true },
  { label: 'Bookings',  path: '/driver/bookings' },
]

const renderSidebar = (props = {}) =>
  render(
    <Sidebar
      navItems={defaultNav}
      title="Driver Menu"
      mobileOpen={false}
      onMenuToggle={vi.fn()}
      {...props}
    />
  )

// Tests
describe('Sidebar', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('renders the ParkEase logo', () => {
    renderSidebar()
    expect(screen.getByText('ParkEase')).toBeInTheDocument()
  })

  it('renders the nav group title', () => {
    renderSidebar()
    expect(screen.getByText('Driver Menu')).toBeInTheDocument()
  })

  it('renders all nav item labels', () => {
    renderSidebar()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Bookings')).toBeInTheDocument()
  })

  it('renders user name and role label from mocked api helpers', () => {
    renderSidebar()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Driver')).toBeInTheDocument()
  })

  it('renders user initials derived from full name', () => {
    renderSidebar()
    // Verify "John Doe" correctly maps to initials "JD"
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('calls navigate("/login") and clearAuth on logout button click', async () => {
    const { clearAuth } = await import('../../utils/api')
    renderSidebar()
    // Verify logout button triggers logout flow
    await userEvent.click(screen.getByTitle('Logout'))
    expect(clearAuth).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('does not show sidebar-backdrop when mobileOpen is false', () => {
    const { container } = renderSidebar({ mobileOpen: false })
    expect(container.querySelector('.sidebar-backdrop')).not.toBeInTheDocument()
  })

  it('shows sidebar-backdrop when mobileOpen is true', () => {
    const { container } = renderSidebar({ mobileOpen: true })
    expect(container.querySelector('.sidebar-backdrop')).toBeInTheDocument()
  })

  it('applies sidebar-open class to aside when mobileOpen is true', () => {
    const { container } = renderSidebar({ mobileOpen: true })
    expect(container.querySelector('aside')).toHaveClass('sidebar-open')
  })

  it('calls onMenuToggle when backdrop is clicked', async () => {
    const onMenuToggle = vi.fn()
    const { container } = renderSidebar({ mobileOpen: true, onMenuToggle })
    await userEvent.click(container.querySelector('.sidebar-backdrop'))
    expect(onMenuToggle).toHaveBeenCalled()
  })

  it('calls onMenuToggle when close button is clicked', async () => {
    const onMenuToggle = vi.fn()
    renderSidebar({ mobileOpen: true, onMenuToggle })
    await userEvent.click(screen.getByLabelText('Close menu'))
    expect(onMenuToggle).toHaveBeenCalled()
  })

  it('renders badge when nav item has badge > 0', () => {
    const navWithBadge = [
      ...defaultNav,
      { label: 'Notifications', path: '/driver/notifications', badge: 5 },
    ]
    renderSidebar({ navItems: navWithBadge })
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders 99+ when badge exceeds 99', () => {
    const navWithBadge = [
      ...defaultNav,
      { label: 'Notifications', path: '/driver/notifications', badge: 150 },
    ]
    renderSidebar({ navItems: navWithBadge })
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('does not render badge element when badge is 0', () => {
    const navWithZeroBadge = [
      { label: 'Notifications', path: '/driver/notifications', badge: 0 },
    ]
    renderSidebar({ navItems: navWithZeroBadge })
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('calls onMenuToggle when a nav item is clicked in mobile open mode', async () => {
    const onMenuToggle = vi.fn()
    renderSidebar({ mobileOpen: true, onMenuToggle })
    await userEvent.click(screen.getByTestId('navlink-/driver'))
    expect(onMenuToggle).toHaveBeenCalled()
  })
})
