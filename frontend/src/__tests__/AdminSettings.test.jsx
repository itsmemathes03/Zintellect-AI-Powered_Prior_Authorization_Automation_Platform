import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "./test-utils"
import AdminSettings from "../pages/AdminSettings"

const { mockGetAdminSettings, mockUpdateAdminSettings } = vi.hoisted(() => ({
  mockGetAdminSettings: vi.fn(),
  mockUpdateAdminSettings: vi.fn(),
}))

vi.mock("../services/api", () => ({
  getAdminSettings: mockGetAdminSettings,
  updateAdminSettings: mockUpdateAdminSettings,
}))

describe("AdminSettings", () => {
  beforeEach(() => {
    mockGetAdminSettings.mockResolvedValue({
      data: { settings: { routine_hours: 48, urgent_hours: 24, critical_hours: 12 } },
    })
    mockUpdateAdminSettings.mockResolvedValue({
      data: { status: "Success", message: "Settings updated" },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders the page title after loading", async () => {
    render(<AdminSettings />)

    await waitFor(() => {
      expect(screen.getByText("System Settings")).toBeInTheDocument()
    })
  })

  it("shows loading spinner initially", () => {
    render(<AdminSettings />)

    expect(screen.getByText("Loading settings...")).toBeInTheDocument()
  })

  it("loads settings on mount", async () => {
    render(<AdminSettings />)

    await waitFor(() => {
      expect(mockGetAdminSettings).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.queryByText("Loading settings...")).not.toBeInTheDocument()
    })
  })

  it("displays the loaded SLA values", async () => {
    render(<AdminSettings />)

    const numberInputs = await screen.findAllByRole("spinbutton")
    expect(numberInputs).toHaveLength(3)
    expect(numberInputs[0]).toHaveValue(48)
    expect(numberInputs[1]).toHaveValue(24)
    expect(numberInputs[2]).toHaveValue(12)
  })

  it("shows error toast when settings fail to load", async () => {
    mockGetAdminSettings.mockRejectedValueOnce(new Error("API error"))

    render(<AdminSettings />)

    await waitFor(() => {
      expect(screen.getByText("Failed to load settings")).toBeInTheDocument()
    })
  })

  it("allows updating a number input value using fireEvent", async () => {
    render(<AdminSettings />)

    const numberInputs = await screen.findAllByRole("spinbutton")
    const routineInput = numberInputs[0]

    fireEvent.change(routineInput, { target: { value: "72" } })

    await waitFor(() => {
      expect(routineInput).toHaveValue(72)
    })
  })

  it("clamps values to min 1 and max 168", async () => {
    render(<AdminSettings />)

    const numberInputs = await screen.findAllByRole("spinbutton")

    fireEvent.change(numberInputs[0], { target: { value: "0" } })

    await waitFor(() => {
      expect(numberInputs[0]).toHaveValue(1)
    })

    fireEvent.change(numberInputs[0], { target: { value: "200" } })

    await waitFor(() => {
      expect(numberInputs[0]).toHaveValue(168)
    })
  })

  it("saves settings and shows success toast", async () => {
    render(<AdminSettings />)

    const numberInputs = await screen.findAllByRole("spinbutton")
    fireEvent.change(numberInputs[0], { target: { value: "72" } })

    await userEvent.click(screen.getByText("Save Settings"))

    await waitFor(() => {
      expect(mockUpdateAdminSettings).toHaveBeenCalledWith({
        routine_hours: 72,
        urgent_hours: 24,
        critical_hours: 12,
      })
    })

    await waitFor(() => {
      expect(
        screen.getByText(/SLA timers will use the new values/)
      ).toBeInTheDocument()
    })
  })

  it("shows error toast when save fails", async () => {
    mockUpdateAdminSettings.mockRejectedValueOnce({
      response: { data: { detail: "Internal server error" } },
    })

    render(<AdminSettings />)

    await screen.findAllByRole("spinbutton")

    await userEvent.click(screen.getByText("Save Settings"))

    await waitFor(() => {
      expect(screen.getByText("Internal server error")).toBeInTheDocument()
    })
  })

  it("displays the SLA configuration summary", async () => {
    render(<AdminSettings />)

    await waitFor(() => {
      expect(screen.getByText(/Routine:/)).toBeInTheDocument()
      expect(screen.getByText(/Urgent:/)).toBeInTheDocument()
      expect(screen.getByText(/Critical:/)).toBeInTheDocument()
    })

    expect(screen.getByText(/48h/)).toBeInTheDocument()
    expect(screen.getByText(/24h/)).toBeInTheDocument()
    expect(screen.getByText(/12h/)).toBeInTheDocument()
  })

  it("has correct section headings", async () => {
    render(<AdminSettings />)

    await waitFor(() => {
      expect(screen.getByText("SLA Duration Settings")).toBeInTheDocument()
    })
  })
})
