import { useState, useRef } from "react"

import {

  UploadCloud,

  FileText,

  Trash2,

  CheckCircle2,

  AlertCircle,

  BrainCircuit,

  ShieldCheck

} from "lucide-react"

export default function FileUpload({ setFiles }) {

  // ==========================================
  // STATES
  // ==========================================

  const [selectedFiles, setSelectedFiles] = useState([])

  const [dragging, setDragging] = useState(false)

  const fileInputRef = useRef(null)

  // ==========================================
  // PROCESS FILES
  // ==========================================

  const processFiles = (uploadedFiles) => {

    const validFiles = uploadedFiles.filter((file) => {

      return (

        file.type === "application/pdf" ||

        file.type === "text/plain"
      )
    })

    if (validFiles.length !== uploadedFiles.length) {

      alert("Only PDF and TXT files allowed")
    }

    const updatedFiles = [

      ...selectedFiles,

      ...validFiles
    ]

    // MAX LIMIT

    if (updatedFiles.length > 5) {

      alert("Maximum 5 files allowed")

      return
    }

    setSelectedFiles(updatedFiles)

    setFiles(updatedFiles)
  }

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleFiles = (e) => {

    const uploadedFiles = Array.from(e.target.files)

    processFiles(uploadedFiles)
  }

  // ==========================================
  // DROP
  // ==========================================

  const handleDrop = (e) => {

    e.preventDefault()

    setDragging(false)

    const uploadedFiles = Array.from(

      e.dataTransfer.files
    )

    processFiles(uploadedFiles)
  }

  // ==========================================
  // REMOVE FILE
  // ==========================================

  const removeFile = (indexToRemove) => {

    const updatedFiles = selectedFiles.filter(

      (_, index) =>

        index !== indexToRemove
    )

    setSelectedFiles(updatedFiles)

    setFiles(updatedFiles)
  }

  return (

    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-6">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

        <div className="flex items-center gap-4">

          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-700 to-sky-600 flex items-center justify-center shadow-md">

            <UploadCloud
              className="text-white"
              size={22}
            />

          </div>

          <div>

            <h2 className="text-lg font-bold text-slate-900">

              Medical Documents

            </h2>

            <p className="text-xs text-slate-500">

              Upload clinical documents for AI analysis

            </p>

          </div>

        </div>

        {/* FILE COUNTER */}

        <div className="bg-gradient-to-r from-cyan-700 to-sky-700 text-white px-5 py-3 rounded-xl shadow-md">

          <p className="text-[10px] text-cyan-100 font-semibold tracking-wide">

            FILES SELECTED

          </p>

          <h2 className="text-3xl font-extrabold mt-1">

            {selectedFiles.length}

            <span className="text-cyan-300 text-base">

              /5

            </span>

          </h2>

        </div>

      </div>

      {/* UPLOAD AREA */}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() =>
          setDragging(false)
        }
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          dragging
            ? "border-cyan-500 bg-cyan-50/50"
            : "border-slate-200 bg-slate-50/50 hover:bg-cyan-50/30"
        }`}
      >

        <div className="w-16 h-16 rounded-xl bg-white shadow-md flex items-center justify-center mx-auto">

          <UploadCloud
            className="text-cyan-700"
            size={28}
          />

        </div>

        <h2 className="text-lg font-bold text-slate-900 mt-4">

          Drop files or click to browse

        </h2>

        <p className="text-xs text-slate-500 mt-1">

          PDF, TXT — Max 5 files

        </p>

        {/* BUTTON */}

        <button
          type="button"
          onClick={() =>
            fileInputRef.current.click()
          }
          className="mt-4 bg-gradient-to-r from-cyan-700 to-sky-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
        >

          Browse Files

        </button>

        {/* HIDDEN INPUT */}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt"
          onChange={handleFiles}
          className="hidden"
        />

      </div>

      {/* FILE LIST */}

      {

        selectedFiles.length > 0 && (

          <div className="mt-6">

            <div className="flex items-center gap-2 mb-4">

              <CheckCircle2
                className="text-emerald-600"
                size={18}
              />

              <h2 className="text-sm font-bold text-slate-900">

                Uploaded Files

              </h2>

            </div>

            <div className="space-y-3">

              {

                selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 hover:shadow-md transition-all"
                  >

                    {/* LEFT */}

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">

                        <FileText
                          className="text-cyan-700"
                          size={18}
                        />

                      </div>

                      <div>

                        <h3 className="text-sm font-semibold text-slate-900 break-all">

                          {file.name}

                        </h3>

                        <p className="text-xs text-slate-500">

                          {(file.size / 1024).toFixed(2)} KB

                        </p>

                      </div>

                    </div>

                    {/* RIGHT */}

                    <div className="flex flex-wrap items-center gap-3">

                      <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">

                        <CheckCircle2 size={14} />

                        Ready for AI

                      </div>

                      <button
                        onClick={() =>
                          removeFile(index)
                        }
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                      >

                        <Trash2 size={14} />

                        Remove

                      </button>

                    </div>

                  </div>
                ))
              }

            </div>

          </div>
        )
      }

      {/* BOTTOM SECTION */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">

        {/* REQUIREMENTS */}

        <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">

          <div className="flex items-center gap-2 mb-3">

            <ShieldCheck
              className="text-cyan-700"
              size={18}
            />

            <h2 className="text-sm font-bold text-slate-900">

              Upload Requirements

            </h2>

          </div>

          <ul className="space-y-1.5 text-xs text-slate-600">

            <li>• Minimum 3 documents required</li>

            <li>• Maximum 5 files allowed</li>

            <li>• PDF and TXT supported</li>

            <li>• Clinical notes recommended</li>

            <li>• AI-ready healthcare evidence</li>

          </ul>

        </div>

        {/* AI SECTION */}

        <div className="bg-gradient-to-r from-cyan-800 to-sky-700 rounded-xl p-4 text-white shadow-md">

          <div className="flex items-center gap-2 mb-3">

            <BrainCircuit
              className="text-cyan-300"
              size={18}
            />

            <h2 className="text-sm font-bold">

              AI Processing Pipeline

            </h2>

          </div>

          <div className="space-y-2">

            <div className="flex items-center gap-2">

              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>

              <p className="text-xs">OCR Clinical Extraction</p>

            </div>

            <div className="flex items-center gap-2">

              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>

              <p className="text-xs">Medical Entity Recognition</p>

            </div>

            <div className="flex items-center gap-2">

              <div className="w-2 h-2 rounded-full bg-purple-400"></div>

              <p className="text-xs">Insurance Policy Matching</p>

            </div>

            <div className="flex items-center gap-2">

              <div className="w-2 h-2 rounded-full bg-orange-400"></div>

              <p className="text-xs">Authorization Decision Engine</p>

            </div>

          </div>

        </div>

      </div>

      {/* WARNING */}

      {
        selectedFiles.length < 3 && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="text-orange-600 mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-xs font-semibold text-orange-800">Minimum 3 documents required</p>
              <p className="text-xs text-orange-700 mt-0.5">Upload at least 3 healthcare documents before submission.</p>
            </div>
          </div>
        )
      }

    </div>
  )
}
