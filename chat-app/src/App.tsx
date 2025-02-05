import { useState, useRef, useEffect } from "react";
import type { Message } from "./models";
import LoadingChat from "./components/LoadingChat";
import BotContent from "./components/BotContent";
import MarkdownRenderer from "./components/MarkdownRenderer";
import ModelDropdown from "./components/ModelDropdown";
import ChatInput from "./components/ChatInput";
import logo from "./assets/vlad-chat.jpg";

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("deepseek-r1:14b");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageStream = async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages(prev => [...prev, { role: "user", content: trimmed }]);

    // Add a placeholder bot message that we will update as chunks arrive.
    setIsLoading(true);
    setMessages(prev => [...prev, { role: "bot", content: "", loading: true }]);

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: trimmed,
          stream: true,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("ReadableStream not supported");
      }

      const decoder = new TextDecoder();
      let streamedText = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              streamedText += data.response;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "bot",
                  content: streamedText,
                  loading: false,
                };
                return updated;
              });
            }
          } catch (parseError) {
            console.error("Failed to parse chunk:", line);
            continue;
          }
        }
      }
    } catch (error: any) {
      setMessages(prev => [...prev.slice(0, -1), { role: "bot", content: "Error: " + error.toString(), loading: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center p-6'>
      <div className='flex space-x-8'>
        <h1 className='text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-700 via-blue-700 to-white mb-8'>Vlad Chat</h1>
        <ModelDropdown onModelSelect={handleModelChange} />
        <img src={logo} alt='Vlad Chat logo' className='size-14' />
      </div>
      <div className='w-full max-w-7xl bg-gray-900 rounded-3xl shadow-2xl p-6 flex flex-col'>
        <div className='flex-grow overflow-y-auto space-y-4 mb-6 pr-4 h-[70vh]'>
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-4 rounded-xl max-w-4xl ${msg.role === "user" ? "bg-blue-900 text-white" : "bg-gray-700 text-gray-100"}`}>
                <div className='font-bold mb-1'>{msg.role === "user" ? "You" : "Bot"}</div>
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

        <div className='flex space-x-4'>
          <ChatInput disabled={isLoading} onSend={sendMessageStream} />
        </div>
      </div>
    </div>
  );
}

export default App;
