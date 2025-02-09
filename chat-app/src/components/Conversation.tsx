import { useEffect, useRef, useState } from "react";
import ChatInput from "./ChatInput";
import MarkdownRenderer from "./MarkdownRenderer";
import BotContent from "./BotContent";
import LoadingChat from "./LoadingChat";
import { Chat, ChatCompletionChunk, Message } from "../models";
import { addNewChat, getChatById, updateChat } from "../utils/chatHistory";
import CopyCode from "./CopyCode";

function Conversation({ chatId, model, onUpdateChatName }: { chatId: string; model: string; onUpdateChatName: () => void }) {
  const [chat, setChat] = useState<Chat | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    const chat = getChatById(chatId);
    if (chat) {
      setChat(chat);
    } else {
      const newChat = { id: chatId, name: "", messages: [] } as Chat;
      setChat(newChat);
      addNewChat(newChat);
    }
  }, [chatId]);

  const JsonTryParse = <T,>(str: string): T | undefined => {
    try {
      const jsonValue = JSON.parse(str) as T;
      return jsonValue;
    } catch {
      console.error("Failed to parse JSON", str);
      return undefined;
    }
  };

  const createNameForChat = async (input: string, isLocalhost: boolean) => {
    const prompt =
      "Create a short rememberable name for this chat with a little slavic twist. Only respond with the name and nothing else. The context of the chat is: " +
      input;
    let newName = "";
    if (isLocalhost) {
      const body = JSON.stringify({ model: model, prompt: prompt, stream: false });
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      });
      const data = await response.json();
      newName = data.response;
    } else {
      const body = JSON.stringify({ message: prompt });
      const response = await fetch(import.meta.env.VITE_SERVER_URL + "/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: body,
      });
      const data = await response.json();
      newName = data.choices[0].text;
    }

    setChat(prev => {
      if (!prev) return prev;
      const nameWithoutThink = newName.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
      const updated = { ...prev };
      updated.name = nameWithoutThink;
      updateChat(updated);
      onUpdateChatName();
      return updated;
    });
  };

  const sendMessageStream = async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed || !chat) return;

    const isLocalhost = window.location.hostname === "localhost";
    if (chat.messages.length === 0) {
      createNameForChat(trimmed, isLocalhost);
    }

    setChat(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.messages.push({ role: "user", content: trimmed });
      return updated;
    });

    setIsLoading(true);

    setChat(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.messages.push({ role: "bot", content: "", loading: true });
      return updated;
    });

    if (!isLocalhost) {
      const body = JSON.stringify({ message: trimmed });
      await sendMessageViaMiddlemanStream(body);
    } else {
      const body = JSON.stringify({
        model: model,
        prompt: trimmed,
        stream: true,
      });
      await sendMessageDirectlyStream(body);
    }

    setIsLoading(false);
    setChat(prev => {
      if (prev) {
        updateChat(prev);
      }
      return prev;
    });
  };

  const updateLastMessage = (message: Message) => {
    setChat(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.messages[updated.messages.length - 1] = message;
      return updated;
    });
  };

  const sendMessageViaMiddlemanStream = async (body: string) => {
    try {
      const response = await fetch(import.meta.env.VITE_SERVER_URL + "/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: body,
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("ReadableStream not supported");
      }

      const decoder = new TextDecoder();
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        if (!chunk.startsWith("data: {")) continue;

        const data = JsonTryParse<ChatCompletionChunk>(chunk.slice(5));
        if (!data) continue;

        const contents = data.choices.map(choice => choice.delta.content).join("");
        streamedText += contents;
        const message = {
          role: "bot",
          content: streamedText,
          loading: false,
        } as Message;
        updateLastMessage(message);
      }
    } catch (error: any) {
      const errorMessage = {
        role: "bot",
        content: "Error: " + error.toString(),
        loading: false,
      } as Message;
      updateLastMessage(errorMessage);
    }
  };

  const sendMessageDirectlyStream = async (body: string) => {
    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("ReadableStream not supported");
      }

      const decoder = new TextDecoder();
      let streamedText = "";

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
              const message = {
                role: "bot",
                content: streamedText,
                loading: false,
              } as Message;
              updateLastMessage(message);
            }
          } catch (parseError) {
            console.error("Failed to parse chunk:", line);
            continue;
          }
        }
      }
    } catch (error: any) {
      const errorMessage = { role: "bot", content: "Error: " + error.toString(), loading: false } as Message;
      updateLastMessage(errorMessage);
    }
  };

  return (
    <div className='w-full max-w-7xl bg-gray-900 rounded-3xl shadow-2xl p-6 flex flex-col'>
      <div className='flex-grow overflow-y-auto space-y-4 mb-6 pr-4 h-[60vh] lg:h-[70vh]'>
        {chat?.messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-4 rounded-xl max-w-4xl ${msg.role === "user" ? "bg-blue-900 text-white" : "bg-gray-700 text-gray-100"}`}>
              <div className='font-bold mb-1'>{msg.role === "user" ? "You" : "Bot"}</div>
              <div>
                {msg.role === "bot" ? msg.loading ? <LoadingChat /> : <BotContent content={msg.content} /> : <MarkdownRenderer>{msg.content}</MarkdownRenderer>}
                <CopyCode />
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
  );
}

export default Conversation;
