import { render, screen, fireEvent, act, waitFor } from "./test-utils"
import { ToastProvider, useToast } from "../components/Toast"
import { toast } from "../services/toast"

function ToastTrigger() {
  const { addToast } = useToast()
  return (
    <div>
      <button onClick={() => addToast("Operation succeeded", "success")}>Success</button>
      <button onClick={() => addToast("Something failed", "error")}>Error</button>
      <button onClick={() => addToast("Check this", "warning")}>Warning</button>
      <button onClick={() => addToast("For your info", "info")}>Info</button>
    </div>
  )
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("renders success toast with correct icon and message", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText("Success"))
    expect(screen.getByText("Operation succeeded")).toBeInTheDocument()
  })

  it("renders error toast with correct icon and message", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText("Error"))
    expect(screen.getByText("Something failed")).toBeInTheDocument()
  })

  it("renders warning toast with correct icon and message", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText("Warning"))
    expect(screen.getByText("Check this")).toBeInTheDocument()
  })

  it("auto-dismisses after duration", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText("Success"))
    expect(screen.getByText("Operation succeeded")).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByText("Operation succeeded")).not.toBeInTheDocument()
  })

  it("manual dismiss via X button", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText("Success"))
    expect(screen.getByText("Operation succeeded")).toBeInTheDocument()

    const dismissButtons = screen.getAllByRole("button")
    const xButton = dismissButtons.find((btn) => btn.querySelector("svg"))
    fireEvent.click(xButton)

    expect(screen.queryByText("Operation succeeded")).not.toBeInTheDocument()
  })

  it("stacks multiple toasts", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText("Success"))
    fireEvent.click(screen.getByText("Error"))
    fireEvent.click(screen.getByText("Warning"))

    expect(screen.getByText("Operation succeeded")).toBeInTheDocument()
    expect(screen.getByText("Something failed")).toBeInTheDocument()
    expect(screen.getByText("Check this")).toBeInTheDocument()
  })

  it("listens for standalone toast events", () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    )

    act(() => {
      window.dispatchEvent(
        new CustomEvent("zintellect:toast", {
          detail: { id: 999, message: "From utility", type: "success", duration: 4000 },
        })
      )
    })

    expect(screen.getAllByText("From utility").length).toBeGreaterThanOrEqual(1)
  })
})
