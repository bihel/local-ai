import { PaperAirplaneIcon } from "@heroicons/react/16/solid";
import { useState, useRef, useEffect } from "react";

export interface ChatInputProps {
  disabled: boolean;
  onSend: (message: string) => void;
}

const ChatInput = ({ disabled, onSend }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"; // Set to scroll height
    }
  }, [message]);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Handle keydown events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevents adding a new line forcing shift+enter to add a new line
      handleSend();
    }
  };

  // Handle send action
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSend(trimmedMessage);
      setMessage("");
    }
  };

  return (
    <div className='flex items-start rounded-3xl bg-gray-800 w-full p-3'>
      <textarea
        ref={textareaRef}
        className='max-h-30 flex-1 resize-none overflow-y-auto p-3 rounded-xl text-gray-200 focus:outline-none field-sizing-content disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors'
        placeholder='Type your message...'
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
      />
      <button className='ml-2 bg-gray-600 flex self-end rounded-full disabled:cursor-not-allowed' disabled={disabled} onClick={handleSend}>
        <div className='p-2'>
          <PaperAirplaneIcon className='w-6 h-6 text-gray-200' />
        </div>
      </button>
    </div>
  );
};

export default ChatInput;
