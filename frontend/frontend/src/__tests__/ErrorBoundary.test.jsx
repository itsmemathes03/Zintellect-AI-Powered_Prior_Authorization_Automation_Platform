import { render, screen, fireEvent } from "./test-utils"
import ErrorBoundary from "../components/ErrorBoundary"

const ThrowComponent = () => {
  throw new Error("Test error")
}

describe("ErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText("Safe Content")).toBeInTheDocument()
  })

  it("renders fallback UI when child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByText("Test error")).toBeInTheDocument()
    spy.mockRestore()
  })

  it("renders custom fallback when provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={<div>Custom Fallback</div>}>
        <ThrowComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText("Custom Fallback")).toBeInTheDocument()
    spy.mockRestore()
  })

  it("resets error state on Try Again click", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const onReset = vi.fn()
    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowComponent />
      </ErrorBoundary>
    )
    const tryAgain = screen.getByLabelText("Try again")
    fireEvent.click(tryAgain)
    expect(onReset).toHaveBeenCalled()
    spy.mockRestore()
  })
})
