import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  Topbar,
  Modal,
  Spinner,
  Alert,
  StatusBadge,
  EmptyState,
  ConfirmModal,
  SuspensionOverlay,
} from '../../components/common/UI'

// Topbar Component Tests
describe('Topbar', () => {
  it('renders the title', () => {
    render(<Topbar title="Dashboard" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<Topbar title="Home" subtitle="Welcome back" />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('renders hamburger button and calls onMenuToggle on click', async () => {
    const onMenuToggle = vi.fn()
    render(<Topbar title="Home" onMenuToggle={onMenuToggle} />)
    const btn = screen.getByLabelText('Open menu')
    await userEvent.click(btn)
    expect(onMenuToggle).toHaveBeenCalledOnce()
  })

  it('does not render hamburger button when onMenuToggle is not provided', () => {
    render(<Topbar title="Home" />)
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument()
  })

  it('renders children inside topbar-actions', () => {
    render(<Topbar title="Home"><button>Action</button></Topbar>)
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })
})

// Modal Component Tests
describe('Modal', () => {
  const onClose = vi.fn()

  it('renders nothing when isOpen is false', () => {
    render(<Modal isOpen={false} onClose={onClose} title="Test" />)
    expect(screen.queryByText('Test')).not.toBeInTheDocument()
  })

  it('renders title when isOpen is true', () => {
    render(<Modal isOpen={true} onClose={onClose} title="My Modal" />)
    expect(screen.getByText('My Modal')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<Modal isOpen={true} onClose={onClose} title="T" subtitle="Sub text" />)
    expect(screen.getByText('Sub text')).toBeInTheDocument()
  })

  it('renders children inside modal body', () => {
    render(<Modal isOpen={true} onClose={onClose} title="T"><p>Body content</p></Modal>)
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const closeFn = vi.fn()
    render(<Modal isOpen={true} onClose={closeFn} title="T" />)
    await userEvent.click(screen.getByText('✕'))
    expect(closeFn).toHaveBeenCalled()
  })
})

// Spinner Component Tests
describe('Spinner', () => {
  it('renders spinner-wrap container', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('.spinner-wrap')).toBeInTheDocument()
  })

  it('renders inner spinner element', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('.spinner')).toBeInTheDocument()
  })
})

// Alert Component Tests
describe('Alert', () => {
  it('renders children text', () => {
    render(<Alert>Something went wrong</Alert>)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('applies default info type class', () => {
    const { container } = render(<Alert>Info</Alert>)
    expect(container.firstChild).toHaveClass('alert-info')
  })

  it('applies the provided type class', () => {
    const { container } = render(<Alert type="danger">Danger</Alert>)
    expect(container.firstChild).toHaveClass('alert-danger')
  })

  it('renders close button when onClose is provided', () => {
    const onClose = vi.fn()
    render(<Alert onClose={onClose}>Msg</Alert>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<Alert onClose={onClose}>Msg</Alert>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render close button when onClose is not provided', () => {
    render(<Alert>No close</Alert>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

// StatusBadge Component Tests
describe('StatusBadge', () => {
  it('renders RESERVED label', () => {
    render(<StatusBadge status="RESERVED" />)
    expect(screen.getByText('Reserved')).toBeInTheDocument()
  })

  it('renders ACTIVE label', () => {
    render(<StatusBadge status="ACTIVE" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders COMPLETED label', () => {
    render(<StatusBadge status="COMPLETED" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('renders CANCELLED label', () => {
    render(<StatusBadge status="CANCELLED" />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })

  it('renders PENDING label', () => {
    render(<StatusBadge status="PENDING" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders PAID label', () => {
    render(<StatusBadge status="PAID" />)
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('renders FAILED label', () => {
    render(<StatusBadge status="FAILED" />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('renders AVAILABLE label', () => {
    render(<StatusBadge status="AVAILABLE" />)
    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('renders the raw status when unknown', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />)
    expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument()
  })

  it('renders dot by default', () => {
    const { container } = render(<StatusBadge status="ACTIVE" />)
    expect(container.querySelector('.badge-dot')).toBeInTheDocument()
  })

  it('hides dot when dot=false', () => {
    const { container } = render(<StatusBadge status="ACTIVE" dot={false} />)
    expect(container.querySelector('.badge-dot')).not.toBeInTheDocument()
  })
})

// EmptyState Component Tests
describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('renders the default icon', () => {
    const { container } = render(<EmptyState title="T" />)
    expect(container.querySelector('.empty-icon')).toHaveTextContent('📭')
  })

  it('renders a custom icon', () => {
    const { container } = render(<EmptyState icon="🚗" title="T" />)
    expect(container.querySelector('.empty-icon')).toHaveTextContent('🚗')
  })

  it('renders message when provided', () => {
    render(<EmptyState title="T" message="No data available" />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('renders action element when provided', () => {
    render(<EmptyState title="T" action={<button>Add item</button>} />)
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument()
  })
})

// ConfirmModal Component Tests
describe('ConfirmModal', () => {
  it('renders nothing when isOpen is false', () => {
    render(<ConfirmModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} title="Delete?" message="Are you sure?" />)
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument()
  })

  it('renders title and message when open', () => {
    render(<ConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} title="Delete?" message="Are you sure?" />)
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('calls onConfirm and onClose when Confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    const onClose   = vi.fn()
    render(<ConfirmModal isOpen={true} onClose={onClose} onConfirm={onConfirm} title="T" message="M" />)
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Cancel button is clicked', async () => {
    const onClose = vi.fn()
    render(<ConfirmModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} title="T" message="M" />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('applies btn-danger class when danger prop is true', () => {
    render(<ConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} title="T" message="M" danger={true} />)
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmBtn).toHaveClass('btn-danger')
  })
})

// SuspensionOverlay Component Tests
describe('SuspensionOverlay', () => {
  it('renders Account Suspended heading', () => {
    render(<SuspensionOverlay />)
    expect(screen.getByText('Account Suspended')).toBeInTheDocument()
  })

  it('renders the suspension message', () => {
    render(<SuspensionOverlay />)
    expect(screen.getByText(/suspended by an administrator/i)).toBeInTheDocument()
  })

  it('renders the Logout button', () => {
    render(<SuspensionOverlay />)
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('clears localStorage and redirects on Logout click', async () => {
    const clearFn  = vi.fn()
    const fakeStorage = { clear: clearFn, getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }
    vi.stubGlobal('localStorage', fakeStorage)

    // Stub location object to capture href changes
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    })

    render(<SuspensionOverlay />)
    await userEvent.click(screen.getByRole('button', { name: /logout/i }))

    expect(clearFn).toHaveBeenCalled()
    expect(window.location.href).toBe('/login')

    // Restore original location object
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    vi.unstubAllGlobals()
  })
})
