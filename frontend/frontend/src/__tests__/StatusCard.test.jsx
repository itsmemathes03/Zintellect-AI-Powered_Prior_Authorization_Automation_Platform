import { render, screen } from "./test-utils"
import StatusCard from "../components/StatusCard"

describe("StatusCard", () => {
  it("shows Approved status with green styling", () => {
    render(
      <StatusCard
        result={{
          status: "Approved",
          confidence_score: 92,
          processing_time_seconds: 3.2,
          request_id: "req-abc12345def",
          message: "Authorization approved based on clinical evidence.",
        }}
      />
    )
    expect(screen.getByText("Approved")).toBeInTheDocument()
    expect(screen.getByText("92%")).toBeInTheDocument()
    expect(screen.getByText(/Processed in 3\.2s/)).toBeInTheDocument()
    expect(screen.getByText("req-abc1...")).toBeInTheDocument()
  })

  it("shows Rejected status with red styling", () => {
    render(
      <StatusCard
        result={{
          status: "Rejected",
          confidence_score: 15,
          processing_time_seconds: 4.1,
          request_id: "req-rejected123",
          message: "Insufficient clinical documentation.",
        }}
      />
    )
    expect(screen.getByText("Rejected")).toBeInTheDocument()
    expect(screen.getByText("15%")).toBeInTheDocument()
  })

  it("shows Pending status with orange styling", () => {
    render(
      <StatusCard
        result={{
          status: "Pending",
          confidence_score: 50,
          processing_time_seconds: 1.5,
          request_id: "req-pending000",
          message: "Awaiting review.",
        }}
      />
    )
    expect(screen.getByText("Pending Review")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
  })

  it("displays confidence percentage", () => {
    render(
      <StatusCard
        result={{
          status: "Approved",
          confidence_score: 87,
          message: "Good match.",
        }}
      />
    )
    expect(screen.getByText("87%")).toBeInTheDocument()
  })

  it("displays processing time", () => {
    render(
      <StatusCard
        result={{
          status: "Approved",
          confidence_score: 87,
          processing_time_seconds: 2.7,
          message: "Done.",
        }}
      />
    )
    expect(screen.getByText("Processed in 2.7s")).toBeInTheDocument()
  })

  it("displays request ID", () => {
    render(
      <StatusCard
        result={{
          status: "Approved",
          confidence_score: 87,
          request_id: "req-abc123456789",
          message: "Done.",
        }}
      />
    )
    expect(screen.getByText("req-abc1...")).toBeInTheDocument()
  })

  it("returns null when no result", () => {
    const { container } = render(<StatusCard result={null} />)
    expect(screen.queryByText("Approved")).not.toBeInTheDocument()
    expect(screen.queryByText("Rejected")).not.toBeInTheDocument()
    expect(screen.queryByText("Pending Review")).not.toBeInTheDocument()
  })
})
