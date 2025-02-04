// src/App.tsx
import type React from "react";
import { useState, useRef, useEffect } from "react"
import type { ChatCompletionChunk, Message } from "../models"
import LoadingChat from "./components/LoadingChat"
import BotContent from "./components/BotContent"
import MarkdownRenderer from "./components/MarkdownRenderer"
import ModelDropdown from "./components/ModelDropdown";

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [selectedModel, setSelectedModel] = useState<string>("deepseek-r1:14b")
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const JsonTryParse = <T,>(str: string): T | undefined => {
    try {
      const jsonValue = JSON.parse(str) as T
      return jsonValue
    } catch {
      console.error("Failed to parse JSON", str)
      return undefined
    }
  }

  const sendMessageStream = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages(prev => [...prev, { role: "user", content: trimmed }])

    // Add a placeholder bot message that we will update as chunks arrive.
    setMessages(prev => [...prev, { role: "bot", content: "", loading: true }])
    setInput("")

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: trimmed,
          stream: true
        }),
      })

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("ReadableStream not supported")
      }

      const decoder = new TextDecoder()
      let streamedText = ""

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.response) {
              streamedText += data.response
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: "bot",
                  content: streamedText,
                  loading: false,
                }
                return updated
              })
            }
          } catch (parseError) {
            console.error("Failed to parse chunk:", line)
            continue
          }
        }
      }
    } catch (error: any) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "bot", content: "Error: " + error.toString() },
      ])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessageStream()
    }
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-8">
        LLM Chat
      </h1>
      <div>
        <ModelDropdown onModelSelect={handleModelChange} />
      </div>
      <div className="w-full max-w-7xl bg-gray-900 rounded-3xl shadow-2xl p-6 flex flex-col">
        <div className="flex-grow overflow-y-auto space-y-4 mb-6 pr-4 max-h-[80vh]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-4 rounded-xl max-w-4xl ${
                  msg.role === "user"
                    ? "bg-blue-900 text-white"
                    : "bg-gray-700 text-gray-100"
                }`}
              >
                <div className="font-bold mb-1">
                  {msg.role === "user" ? "You" : "Bot"}
                </div>
                <div>
                  {msg.role === "bot" ? (
                    msg.loading ? (
                      <LoadingChat />
                    ) : (
                      <BotContent content={msg.content} />
                    )
                  ) : (
                    <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="flex space-x-4">
          <input
            type="text"
            className="flex-grow p-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="px-6 py-3 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600 transition-colors"
            onClick={sendMessageStream}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
