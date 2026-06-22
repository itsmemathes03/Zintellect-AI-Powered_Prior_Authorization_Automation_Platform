import {
  useState,
  useRef,
  useEffect
} from "react"

import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  Loader
} from "lucide-react"

export default function AICopilot() {

  // ==========================================
  // STATES
  // ==========================================

  const [isOpen, setIsOpen] = useState(false)

  const [messages, setMessages] = useState([

    {
      id: 1,

      text: "Hi! I'm Zintellect AI. Ask me anything about prior authorizations, policies, or your requests.",

      sender: "ai",

      timestamp: new Date()
    }
  ])

  const [input, setInput] = useState("")

  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef(null)

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
  // SEND MESSAGE
  // ==========================================

  const handleSendMessage = async () => {

    if (!input.trim()) return

    // Add user message

    const userMessage = {

      id: messages.length + 1,

      text: input,

      sender: "user",

      timestamp: new Date()
    }

    setMessages([...messages, userMessage])

    setInput("")

    setLoading(true)

    // Simulate AI response

    setTimeout(() => {

      const aiResponses = [

        "This authorization requirement is based on the patient's diagnosis and the procedure code submitted.",

        "The policy requires supporting clinical evidence. Please upload recent lab reports or imaging results.",

        "Your request is in the policy review stage. Expected decision within 24 hours.",

        "This procedure is typically approved for patients with your diagnosis according to the policy guidelines.",

        "Missing documentation: Recent physician notes and patient medical history would strengthen this request."
      ]

      const randomResponse = aiResponses[

        Math.floor(

          Math.random() * aiResponses.length
        )
      ]

      const aiMessage = {

        id: messages.length + 2,

        text: randomResponse,

        sender: "ai",

        timestamp: new Date()
      }

      setMessages((prev) => [

        ...prev,

        aiMessage
      ])

      setLoading(false)

    }, 1000)

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

            className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-blue-950 to-indigo-800 text-white shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 hover:shadow-3xl animate-bounce"
          >

            <MessageCircle size={32} />

          </button>
        )
      }

      {/* CHAT WINDOW */}

      {

        isOpen && (

          <div className="fixed bottom-8 right-8 w-96 max-h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">

            {/* HEADER */}

            <div className="bg-gradient-to-r from-blue-950 to-indigo-800 text-white p-5 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">

                  <Sparkles size={20} />

                </div>

                <div>

                  <h2 className="font-bold text-lg">

                    Zintellect AI
                  </h2>

                  <p className="text-sm text-blue-100">

                    Healthcare Assistant
                  </p>

                </div>

              </div>

              <button

                onClick={() =>

                  setIsOpen(false)
                }

                className="hover:bg-white/20 p-2 rounded-full transition-all"
              >

                <X size={20} />

              </button>

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

                          : "bg-slate-100 text-slate-900 rounded-bl-none"
                      }`}
                    >

                      <p className="text-sm leading-relaxed">

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

                        Thinking...

                      </p>

                    </div>

                  </div>
                )
              }

              <div ref={messagesEndRef} />

            </div>

            {/* INPUT */}

            <div className="border-t border-slate-200 p-4 bg-white">

              <div className="flex gap-3">

                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) =>

                    setInput(e.target.value)
                  }

                  onKeyPress={(e) => {

                    if (

                      e.key === "Enter" &&

                      !loading
                    ) {

                      handleSendMessage()
                    }
                  }}

                  className="flex-1 border border-slate-300 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
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
