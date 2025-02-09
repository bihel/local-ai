import { useState, useEffect } from "react";
import { addNewChat, deleteChatHistory, getChatHistory } from "../utils/chatHistory";
import { Chat } from "../models";
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/16/solid";

const ChatHistoryDrawer = ({ onSelectChat, onDeleteChat, refresh }: ChatHistoryDraweProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);

  useEffect(() => {
    setChatHistory(getChatHistory());
  }, [refresh]);

  const handleDeleteChat = (chatId: string) => {
    deleteChatHistory(chatId);
    setChatHistory(getChatHistory());
    onDeleteChat(chatId);
  };

  const handleNewChat = () => {
    const newChat = { id: Date.now().toString(), name: "new chat", messages: [] } as Chat;
    addNewChat(newChat);
    setChatHistory(getChatHistory());
    onSelectChat(newChat);
  };

  return (
    <div className={`bg-gray-800 text-white transition-all ${isOpen ? "w-64" : "w-14 bg-transparent"}`}>
      <div className='flex justify-between p-4  text-gray-400 gap-4'>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ArrowsPointingInIcon className='w-6 h-6' /> : <ArrowsPointingOutIcon className='w-6 h-6' />}
        </button>
        <button onClick={handleNewChat}>
          <PencilSquareIcon className='w-6 h-6' />
        </button>
      </div>
      {isOpen && (
        <div className=''>
          <ul className='list-none p-4'>
            {chatHistory.map(chat => (
              <li key={chat.id}>
                <div className='flex justify-between py-2'>
                  <label className='cursor-pointer truncate' title={chat.name} onClick={() => onSelectChat(chat)}>{`${chat.name}`}</label>
                  <button className='cursor-pointer' onClick={() => handleDeleteChat(chat.id)}>
                    <XMarkIcon className='w-4 h-4 text-gray-500' />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ChatHistoryDrawer;

export interface ChatHistoryDraweProps {
  refresh: number;
  onSelectChat: (chat: Chat) => void;
  onDeleteChat: (chatId: string) => void;
}
