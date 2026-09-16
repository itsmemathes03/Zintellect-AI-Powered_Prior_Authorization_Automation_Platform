import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react"

import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  Loader,
  Trash2,
  AlertTriangle,
  HeartPulse,
} from "lucide-react"

import { sendChatMessage } from "../services/chatbotApi"

export default function AICopilot() {

  // ==========================================
  // STATES
  // ==========================================

  const [isOpen, setIsOpen] = useState(false)

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm CareBridge AI, your prior authorization support assistant. I can help you understand authorization requirements, identify missing documents, and prepare a medical-necessity justification draft.",
      sender: "ai",
      timestamp: new Date(),
    }
  ])

  const [input, setInput] = useState("")

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState(null)

  const messagesEndRef = useRef(null)

  const inputRef = useRef(null)

  // ==========================================
  // SCROLL TO BOTTOM
  // ==========================================

  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    })
  }

  useEffect(() => {

    scrollToBottom()

  }, [messages])

  // ==========================================
  // FOCUS INPUT WHEN OPENED
  // ==========================================

  useEffect(() => {

    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }

  }, [isOpen])

  // ==========================================
  // BUILD CONVERSATION HISTORY
  // ==========================================

  const buildHistory = useCallback((allMessages) => {
    // Exclude the initial welcome message and the latest user message
    // History is all prior message pairs (user + assistant)
    const history = []
    const msgArray = Array.isArray(allMessages) ? allMessages : []

    for (let i = 0; i < msgArray.length; i++) {
      const msg = msgArray[i]
      // Skip welcome message and error messages
      if (i === 0 && msg.sender === "ai") continue
      if (msg.isError) continue

      if (msg.sender === "user") {
        history.push({ role: "user", content: msg.text })
      } else if (msg.sender === "ai") {
        history.push({ role: "assistant", content: msg.text })
      }
    }

    // Remove the last assistant message if present,
    // since we're about to send a new user message
    if (history.length > 0 && history[history.length - 1].role === "assistant") {
      history.pop()
    }

    return history
  }, [])

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const handleSendMessage = useCallback(async () => {

    const trimmed = input.trim()

    if (!trimmed || loading) return

    // Clear any previous error
    setError(null)

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      // Build conversation history for the backend
      const history = buildHistory(updatedMessages)

      const data = await sendChatMessage(trimmed, history)

      const aiMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

    } catch (err) {

      console.error("Chat error:", err)

      let errorMessage = "I'm having trouble connecting to the CareBridge AI server. Please try again."

      if (err.response?.status === 502 || err.response?.status === 503) {
        errorMessage = "The CareBridge AI service is temporarily unavailable. Please try again in a moment."
      } else if (err.response?.status === 422) {
        errorMessage = "Please check your message and try again."
      } else if (!err.response) {
        errorMessage = "Unable to connect to the CareBridge AI server. Please ensure it is running on the configured port."
      }

      setError(errorMessage)

      const errorAiMessage = {
        id: Date.now() + 1,
        text: errorMessage,
        sender: "ai",
        timestamp: new Date(),
        isError: true,
      }

      setMessages((prev) => [...prev, errorAiMessage])

    } finally {
      setLoading(false)
    }

  }, [input, loading, messages, buildHistory])

  // ==========================================
  // CLEAR CONVERSATION
  // ==========================================

  const handleClearChat = () => {

    setMessages([
      {
        id: Date.now(),
        text: "Chat cleared. How can I help you with prior authorizations or insurance policies?",
        sender: "ai",
        timestamp: new Date(),
      }
    ])
    setError(null)
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (

    <>

      {/* FLOATING BUTTON */}

      {
        !isOpen && (
          <button
            onClick={() =>
              setIsOpen(true)
            }
            aria-label="Open CareBridge AI assistant"
            className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-blue-950 to-indigo-800 text-white shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 hover:shadow-3xl animate-bounce"
          >

            <MessageCircle size={32} />

          </button>
        )
      }

      {/* CHAT WINDOW */}

      {
        isOpen && (
          <div className="fixed bottom-8 right-8 w-96 max-h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:w-full max-sm:h-full max-sm:rounded-none">

            {/* HEADER */}

            <div className="bg-gradient-to-r from-blue-950 to-indigo-800 text-white p-5 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">

                  <HeartPulse size={20} />

                </div>
                <div>

                  <h2 className="font-bold text-lg">

                    CareBridge AI

                  </h2>
                  <p className="text-sm text-blue-100">

                    Prior Authorization Assistant

                  </p>

                </div>

              </div>

              <div className="flex items-center gap-1">

                <button
                  onClick={handleClearChat}
                  className="hover:bg-white/20 p-2 rounded-full transition-all"
                  title="Clear conversation"
                >
                  <Trash2 size={18} />
                </button>

                <button
                  onClick={() =>
                    setIsOpen(false)
                  }
                  className="hover:bg-white/20 p-2 rounded-full transition-all"
                >
                  <X size={20} />
                </button>

              </div>

            </div>

            {/* MESSAGES */}

            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-slate-50 to-white">

              {
                messages.map((message) => (

                  <div
                    key={message.id}
                    className={`flex gap-3 ${

                      message.sender ===
                      "user"

                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`max-w-xs px-5 py-3 rounded-2xl ${

                        message.sender ===
                        "user"

                          ? "bg-blue-950 text-white rounded-br-none"
                          : message.isError
                            ? "bg-red-50 text-red-800 rounded-bl-none border border-red-200"
                            : "bg-slate-100 text-slate-900 rounded-bl-none"
                      }`}
                    >

                      <p className="text-sm leading-relaxed whitespace-pre-wrap">

                        {message.text}

                      </p>

                    </div>

                  </div>
                ))
              }

              {
                loading && (

                  <div className="flex gap-3 justify-start">

                    <div className="bg-slate-100 text-slate-900 px-5 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">

                      <Loader
                        size={16}
                        className="animate-spin"
                      />
                      <p className="text-sm">

                        Analyzing your question…

                      </p>

                    </div>

                  </div>
                )
              }

              <div ref={messagesEndRef} />

            </div>

            {/* SAFETY NOTICE */}

            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">

              <p className="text-[11px] text-slate-400 leading-snug flex items-start gap-1.5">

                <AlertTriangle size={12} className="mt-0.5 shrink-0" />

                This assistant provides administrative support only. It does not replace clinical judgment, does not guarantee authorization approval, and should not receive unnecessary patient-identifying information.

              </p>

            </div>

            {/* INPUT */}

            <div className="border-t border-slate-200 p-4 bg-white">

              <div className="flex gap-3">

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about prior auth, documents…"
                  value={input}
                  onChange={(e) =>
                    setInput(e.target.value)
                  }
                  onKeyDown={(e) => {

                    if (
                      e.key === "Enter" &&
                      !loading
                    ) {
                      handleSendMessage()
                    }
                  }}
                  disabled={loading}
                  className="flex-1 border border-slate-300 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                />

                <button
                  onClick={
                    handleSendMessage
                  }
                  disabled={
                    loading ||
                    !input.trim()
                  }
                  className="bg-blue-950 text-white p-2 rounded-full hover:bg-blue-900 disabled:bg-slate-400 transition-all"
                >

                  <Send size={20} />

                </button>

              </div>

            </div>

          </div>
        )
      }

    </>
  )
}
