import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "./test-utils"
import UserManagement from "../pages/UserManagement"

const mockUsers = [
  {
    id: "1",
    email: "doctor@test.com",
    first_name: "Jane",
    last_name: "Doe",
    role: "Doctor",
    phone: "555-0100",
    is_active: true,
    created_at: "2025-01-15T00:00:00Z",
    hospital_name: "General Hospital",
    specialization: "Cardiology",
    license_number: "LIC-123",
    provider_name: null,
  },
  {
    id: "2",
    email: "provider@test.com",
    first_name: "Acme",
    last_name: "Health",
    role: "Provider",
    phone: "555-0200",
    is_active: false,
    created_at: "2025-02-20T00:00:00Z",
    hospital_name: null,
    specialization: null,
    license_number: null,
    provider_name: "Acme Health Inc",
  },
]

const { mockGetAdminUsers, mockCreateUser, mockUpdateUser, mockDeleteUser } =
  vi.hoisted(() => ({
    mockGetAdminUsers: vi.fn(),
    mockCreateUser: vi.fn(),
    mockUpdateUser: vi.fn(),
    mockDeleteUser: vi.fn(),
  }))

vi.mock("../services/api", () => ({
  getAdminUsers: mockGetAdminUsers,
  createUser: mockCreateUser,
  updateUser: mockUpdateUser,
  deleteUser: mockDeleteUser,
}))

describe("UserManagement", () => {
  beforeEach(() => {
    mockGetAdminUsers.mockResolvedValue({
      data: { items: mockUsers, total: mockUsers.length },
    })
    mockCreateUser.mockResolvedValue({ data: { status: "Success" } })
    mockUpdateUser.mockResolvedValue({ data: { status: "Success" } })
    mockDeleteUser.mockResolvedValue({ data: { status: "Success" } })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders the page title and Add User button", async () => {
    render(<UserManagement />)

    expect(screen.getByText("User Management")).toBeInTheDocument()
    expect(screen.getByText("Add User")).toBeInTheDocument()
  })

  it("loads and displays users on mount", async () => {
    render(<UserManagement />)

    await waitFor(() => {
      expect(mockGetAdminUsers).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    expect(screen.getByText("doctor@test.com")).toBeInTheDocument()
    expect(screen.getByText("Acme Health")).toBeInTheDocument()
  })

  it("shows error toast when API call fails", async () => {
    mockGetAdminUsers.mockRejectedValueOnce(new Error("Network error"))

    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText("Failed to load users")).toBeInTheDocument()
    })
  })

  it("opens the Add User modal when clicking Add User button", async () => {
    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /add user/i }))

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /^add user$/i })).toBeInTheDocument()
    })
  })

  it("validates that email is required when creating a user", async () => {
    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /add user/i }))

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /^add user$/i })).toBeInTheDocument()
    })

    const modal = screen.getByRole("heading", { name: /^add user$/i }).closest(".fixed")
    const createBtn = within(modal).getByText("Create User")
    await userEvent.click(createBtn)

    await waitFor(() => {
      expect(screen.getByText("Email and password are required")).toBeInTheDocument()
    })
  })

  it("shows Doctor-specific fields when role is Doctor", async () => {
    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /add user/i }))

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /^add user$/i })).toBeInTheDocument()
    })

    const modal = screen.getByRole("heading", { name: /^add user$/i }).closest(".fixed")

    expect(within(modal).getByText(/hospital/i)).toBeInTheDocument()
    expect(within(modal).getByText(/specialization/i)).toBeInTheDocument()
    expect(within(modal).getByText(/license number/i)).toBeInTheDocument()
  })

  it("shows Provider-specific field when role is Provider", async () => {
    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /add user/i }))

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /^add user$/i })).toBeInTheDocument()
    })

    const modal = screen.getByRole("heading", { name: /^add user$/i }).closest(".fixed")

    const roleSelect = within(modal).getByDisplayValue("Doctor")
    await userEvent.selectOptions(roleSelect, "Provider")

    expect(within(modal).getByText(/provider name/i)).toBeInTheDocument()
    expect(within(modal).queryByText(/hospital/i)).not.toBeInTheDocument()
  })

  it("opens the edit modal with pre-filled data", async () => {
    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    const table = document.querySelector("table")
    const firstRow = table.querySelector("tbody tr")
    const editBtn = firstRow.querySelector("button")
    await userEvent.click(editBtn)

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /edit user/i })).toBeInTheDocument()
    })

    const modal = screen.getByRole("heading", { name: /edit user/i }).closest(".fixed")
    const emailInput = within(modal).getByDisplayValue("doctor@test.com")
    expect(emailInput).toBeInTheDocument()
  })

  it("opens delete confirmation dialog", async () => {
    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    const table = document.querySelector("table")
    const firstRow = table.querySelector("tbody tr")
    const btns = firstRow.querySelectorAll("button")
    const deleteBtn = btns[btns.length - 1]
    await userEvent.click(deleteBtn)

    await waitFor(() => {
      expect(screen.getByText("Deactivate User")).toBeInTheDocument()
    })
  })

  it("creates a new user successfully", async () => {
    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /add user/i }))

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /^add user$/i })).toBeInTheDocument()
    })

    const modal = screen.getByRole("heading", { name: /^add user$/i }).closest(".fixed")

    const emailInput = modal.querySelector('input[type="email"]')
    const passwordInput = modal.querySelector('input[type="password"]')
    await userEvent.type(emailInput, "newuser@test.com")
    await userEvent.type(passwordInput, "password123")

    await userEvent.click(within(modal).getByText("Create User"))

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText("User created successfully")).toBeInTheDocument()
    })
  })

  it("filters users by role", async () => {
    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    const filterSelect = screen.getAllByRole("combobox")[0]
    await userEvent.selectOptions(filterSelect, "Doctor")

    await waitFor(() => {
      expect(mockGetAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ role: "Doctor" })
      )
    })
  })
})
