import { render, screen } from "./test-utils"
import ProcessingTracker from "../components/ProcessingTracker"

const stageNames = [
  "Multimodal OCR Processing",
  "PHI De-identification",
  "Document Classification",
  "Hierarchical Chunking",
  "Vector Embedding Generation",
  "Hybrid Retrieval",
  "Hierarchical RAG Retrieval",
  "Medical NER Extraction",
  "Policy Rule Matching",
  "Weighted Risk Scoring",
  "Explainable AI Generation",
  "Provider Validation",
]

describe("ProcessingTracker", () => {
  it("renders all 12 stages", () => {
    render(<ProcessingTracker currentStage="Multimodal OCR Processing" />)
    stageNames.forEach((name) => {
      expect(screen.getByText(new RegExp(`\\d+\\. ${name}`))).toBeInTheDocument()
    })
  })

  it("shows completed stages with checkmark", () => {
    render(<ProcessingTracker currentStage="PHI De-identification" />)
    const completedBadges = screen.getAllByText("Completed")
    expect(completedBadges.length).toBe(1)
  })

  it("shows active stage with spinner", () => {
    render(<ProcessingTracker currentStage="Document Classification" />)
    expect(screen.getByText("Processing...")).toBeInTheDocument()
    expect(screen.getByText(/3\. Document Classification/)).toBeInTheDocument()
  })

  it("shows pending stages", () => {
    render(<ProcessingTracker currentStage="Multimodal OCR Processing" />)
    const pendingBadges = screen.getAllByText("Pending")
    expect(pendingBadges.length).toBe(11)
  })

  it("progress bar reflects current stage", () => {
    render(<ProcessingTracker currentStage="Hierarchical Chunking" />)
    const progressText = screen.getByText(`${Math.round((4 / 12) * 100)}%`)
    expect(progressText).toBeInTheDocument()
  })

  it("renders header and footer", () => {
    render(<ProcessingTracker currentStage="Multimodal OCR Processing" />)
    expect(screen.getByText("HMH-RAGES AI Pipeline")).toBeInTheDocument()
    expect(screen.getByText("AI Clinical Decision Engine")).toBeInTheDocument()
    expect(screen.getByText("AI Workflow Active")).toBeInTheDocument()
  })

  it("shows current stage name in header", () => {
    render(<ProcessingTracker currentStage="Hybrid Retrieval" />)
    expect(screen.getByText("Hybrid Retrieval")).toBeInTheDocument()
  })
})
