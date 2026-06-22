import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "./test-utils"
import PolicyManagement from "../pages/PolicyManagement"

const mockPolicies = [
  {
    id: "p1",
    procedure_name: "CT Scan",
    insurance_provider: "Blue Cross",
    status: "pending",
    version: "1.0",
    created_at: "2025-03-01T00:00:00Z",
    policy_text: "Coverage policy for CT scans...",
    rejection_comment: null,
  },
  {
    id: "p2",
    procedure_name: "MRI Brain",
    insurance_provider: "Aetna",
    status: "approved",
    version: "2.1",
    created_at: "2025-02-15T00:00:00Z",
    policy_text: "MRI Brain coverage details...",
    rejection_comment: null,
  },
  {
    id: "p3",
    procedure_name: "X-Ray Chest",
    insurance_provider: "Cigna",
    status: "rejected",
    version: "1.0",
    created_at: "2025-01-10T00:00:00Z",
    policy_text: "X-Ray policy text...",
    rejection_comment: "Outdated policy, requires resubmission",
  },
]

const { mockGetAdminPolicies, mockUpdatePolicyStatus } = vi.hoisted(() => ({
  mockGetAdminPolicies: vi.fn(),
  mockUpdatePolicyStatus: vi.fn(),
}))

vi.mock("../services/api", () => ({
  getAdminPolicies: mockGetAdminPolicies,
  updatePolicyStatus: mockUpdatePolicyStatus,
}))

describe("PolicyManagement", () => {
  beforeEach(() => {
    mockGetAdminPolicies.mockResolvedValue({
      data: { items: mockPolicies, total: mockPolicies.length },
    })
    mockUpdatePolicyStatus.mockResolvedValue({ data: { status: "Success" } })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders the page title", async () => {
    render(<PolicyManagement />)

    expect(screen.getByText("Policy Management")).toBeInTheDocument()
    expect(
      screen.getByText(/review and approve/i)
    ).toBeInTheDocument()
  })

  it("loads and displays policies on mount", async () => {
    render(<PolicyManagement />)

    await waitFor(() => {
      expect(mockGetAdminPolicies).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText(/CT Scan/i)).toBeInTheDocument()
    expect(screen.getByText(/MRI Brain/i)).toBeInTheDocument()
    expect(screen.getByText(/X-Ray Chest/i)).toBeInTheDocument()
  })

  it("shows error toast when API call fails", async () => {
    mockGetAdminPolicies.mockRejectedValueOnce(new Error("Network error"))

    render(<PolicyManagement />)

    await waitFor(() => {
      expect(screen.getByText("Failed to load policies")).toBeInTheDocument()
    })
  })

  it("shows status badges for each policy", async () => {
    render(<PolicyManagement />)

    await waitFor(() => {
      expect(screen.getByText(/CT Scan/i)).toBeInTheDocument()
    })

    expect(screen.getByText("pending")).toBeInTheDocument()
    expect(screen.getByText("approved")).toBeInTheDocument()
    expect(screen.getByText("rejected")).toBeInTheDocument()
  })

  it("shows Approve and Reject buttons only for pending policies", async () => {
    render(<PolicyManagement />)

    await waitFor(() => {
      expect(screen.getByText(/CT Scan/i)).toBeInTheDocument()
    })

    const table = document.querySelector("table")
    const approveBtnsInTable = table.querySelectorAll("button")
    const approveTexts = table.textContent.match(/Approve/g)
    const rejectTexts = table.textContent.match(/Reject/g)
    expect(approveTexts).toHaveLength(1)
    expect(rejectTexts).toHaveLength(1)
  })

  it("opens action modal on Approve click", async () => {
    render(<PolicyManagement />)

    await waitFor(() => {
      expect(screen.getByText(/CT Scan/i)).toBeInTheDocument()
    })

    const approveBtn = screen.getByRole("button", { name: "Approve" })
    await userEvent.click(approveBtn)

    await waitFor(() => {
      expect(screen.getByText("Review Policy")).toBeInTheDocument()
    })
  })

  it("approves a policy from the action modal", async () => {
    render(<PolicyManagement />)

    await waitFor(() => {
      expect(screen.getByText(/CT Scan/i)).toBeInTheDocument()
    })

    const approveBtn = screen.getByRole("button", { name: "Approve" })
    await userEvent.click(approveBtn)

    await waitFor(() => {
      expect(screen.getByText("Review Policy")).toBeInTheDocument()
    })

    const modal = document.querySelector(".fixed.inset-0")
    const modalApproveBtn = within(modal).getByText("Approve")
    await userEvent.click(modalApproveBtn)

    await waitFor(() => {
      expect(mockUpdatePolicyStatus).toHaveBeenCalledWith("p1", {
        status: "approved",
        comment: undefined,
      })
    })
  })

  it("rejects a policy with a comment", async () => {
    render(<PolicyManagement />)

    await waitFor(() => {
      expect(screen.getByText(/CT Scan/i)).toBeInTheDocument()
    })

    const rejectBtn = screen.getByRole("button", { name: "Reject" })
    await userEvent.click(rejectBtn)

    await waitFor(() => {
      expect(screen.getByText("Review Policy")).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/comment about this decision/i)
    await userEvent.type(textarea, "Missing required documentation")

    const modal = document.querySelector(".fixed.inset-0")
    const modalRejectBtn = within(modal).getByText("Reject")
    await userEvent.click(modalRejectBtn)

    await waitFor(() => {
      expect(mockUpdatePolicyStatus).toHaveBeenCalledWith("p1", {
        status: "rejected",
        comment: "Missing required documentation",
      })
    })

    await waitFor(() => {
      expect(screen.getByText("Policy rejected successfully")).toBeInTheDocument()
    })
  })

  it("shows preview modal with policy content", async () => {
    render(<PolicyManagement />)

    await waitFor(() => {
      expect(screen.getByText(/CT Scan/i)).toBeInTheDocument()
    })

    const eyeBtn = document.querySelector('table button[title="Preview"]')
    await userEvent.click(eyeBtn)

    await waitFor(() => {
      expect(screen.getByText("Coverage policy for CT scans...")).toBeInTheDocument()
    })
  })

  it("filters policies by status", async () => {
    render(<PolicyManagement />)

    await waitFor(() => {
      expect(screen.getByText(/CT Scan/i)).toBeInTheDocument()
    })

    const statusSelect = screen.getAllByRole("combobox")[0]
    await userEvent.selectOptions(statusSelect, "approved")

    await waitFor(() => {
      expect(mockGetAdminPolicies).toHaveBeenCalledWith(
        expect.objectContaining({ status: "approved" })
      )
    })
  })
})
