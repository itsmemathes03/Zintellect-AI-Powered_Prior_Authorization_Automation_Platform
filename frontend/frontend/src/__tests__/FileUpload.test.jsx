import { render, screen, fireEvent } from "./test-utils"
import FileUpload from "../components/FileUpload"
import { toast } from "../services/toast"

vi.mock("../services/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

function createFile(name, type) {
  return new File(["content"], name, { type })
}

describe("FileUpload", () => {
  let setFiles

  beforeEach(() => {
    setFiles = vi.fn()
    vi.clearAllMocks()
  })

  it("renders upload area with correct text", () => {
    render(<FileUpload setFiles={setFiles} />)
    expect(screen.getByText("Medical Documents")).toBeInTheDocument()
    expect(screen.getByText("Drop files or click to browse")).toBeInTheDocument()
    expect(screen.getByText("Browse Files")).toBeInTheDocument()
  })

  it("accepts PDF files", () => {
    render(<FileUpload setFiles={setFiles} />)
    const input = screen.getByRole("button", { name: /browse files/i }).parentElement.querySelector("input[type=file]")
    const pdf = createFile("doc.pdf", "application/pdf")
    fireEvent.change(input, { target: { files: [pdf] } })
    expect(setFiles).toHaveBeenCalledWith([pdf])
  })

  it("accepts TXT files", () => {
    render(<FileUpload setFiles={setFiles} />)
    const input = screen.getByRole("button", { name: /browse files/i }).parentElement.querySelector("input[type=file]")
    const txt = createFile("notes.txt", "text/plain")
    fireEvent.change(input, { target: { files: [txt] } })
    expect(setFiles).toHaveBeenCalledWith([txt])
  })

  it("rejects non-PDF/TXT files with warning toast", () => {
    render(<FileUpload setFiles={setFiles} />)
    const input = screen.getByRole("button", { name: /browse files/i }).parentElement.querySelector("input[type=file]")
    const img = createFile("photo.png", "image/png")
    fireEvent.change(input, { target: { files: [img] } })
    expect(toast.warning).toHaveBeenCalledWith("Only PDF and TXT files allowed")
    expect(setFiles).toHaveBeenCalledWith([])
  })

  it("enforces max 5 file limit", () => {
    render(<FileUpload setFiles={setFiles} />)
    const input = screen.getByRole("button", { name: /browse files/i }).parentElement.querySelector("input[type=file]")

    const fiveFiles = Array.from({ length: 5 }, (_, i) => createFile(`file${i}.pdf`, "application/pdf"))
    fireEvent.change(input, { target: { files: fiveFiles } })
    expect(setFiles).toHaveBeenCalledWith(fiveFiles)

    const extra = createFile("extra.pdf", "application/pdf")
    fireEvent.change(input, { target: { files: [extra] } })
    expect(toast.warning).toHaveBeenCalledWith("Maximum 5 files allowed")
  })

  it("shows file count", () => {
    render(<FileUpload setFiles={setFiles} />)
    const input = screen.getByRole("button", { name: /browse files/i }).parentElement.querySelector("input[type=file]")
    const file = createFile("test.pdf", "application/pdf")
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("/5")).toBeInTheDocument()
  })

  it("remove file button works", () => {
    render(<FileUpload setFiles={setFiles} />)
    const input = screen.getByRole("button", { name: /browse files/i }).parentElement.querySelector("input[type=file]")
    const file = createFile("test.pdf", "application/pdf")
    fireEvent.change(input, { target: { files: [file] } })

    const removeBtn = screen.getByText("Remove")
    fireEvent.click(removeBtn)
    expect(setFiles).toHaveBeenCalledWith([])
  })

  it("drag and drop area exists", () => {
    render(<FileUpload setFiles={setFiles} />)
    expect(screen.getByText("Drop files or click to browse")).toBeInTheDocument()
    expect(screen.getByText("PDF, TXT — Max 5 files")).toBeInTheDocument()
  })
})
