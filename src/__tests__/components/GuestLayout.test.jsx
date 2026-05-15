import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import GuestLayout from '../../components/guest/GuestLayout'

// Mocks
const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, className }) => (
    <a href={to} className={className}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}))

// Tests
describe('GuestLayout', () => {
  it('renders the ParkEase brand in the navbar', () => {
    render(<GuestLayout />)
    expect(screen.getByText(/ParkEase/)).toBeInTheDocument()
  })

  it('renders the Sign In navigation link', () => {
    render(<GuestLayout />)
    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/login')
  })

  it('renders the Get Started navigation link', () => {
    render(<GuestLayout />)
    const link = screen.getByRole('link', { name: /get started/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/register')
  })

  it('renders children inside guest-main', () => {
    render(<GuestLayout><h1>Welcome</h1></GuestLayout>)
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
  })

  it('calls navigate("/") when logo is clicked', async () => {
    render(<GuestLayout />)
    // Simulate clicking the brand logo
    await userEvent.click(screen.getByText(/ParkEase/))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('renders a <nav> element for the guest navbar', () => {
    const { container } = render(<GuestLayout />)
    expect(container.querySelector('nav.guest-nav')).toBeInTheDocument()
  })

  it('renders a <main> element for guest page content', () => {
    const { container } = render(<GuestLayout />)
    expect(container.querySelector('main.guest-main')).toBeInTheDocument()
  })
})
