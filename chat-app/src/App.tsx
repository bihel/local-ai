import { useState } from "react";
import ModelDropdown from "./components/ModelDropdown";
import logo from "./assets/vlad-chat.jpg";
import ChatHistoryDrawer from "./components/ChatHistoryDrawer";
import Conversation from "./components/Conversation";
import { Chat } from "./models";

function App() {
  const [selectedModel, setSelectedModel] = useState<string>("deepseek-r1:14b");
  const [chatId, setChatId] = useState<string>();
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const onSelectChat = (chat: Chat) => {
    setChatId(chat.id);
  };

  const onDeleteChat = (chatId: string) => {
    if (chatId === chatId) {
      setChatId(undefined);
    }
  };

  const onUpdateChildName = () => {
    setLastUpdated(Date.now());
  };

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800'>
      <ChatHistoryDrawer onSelectChat={onSelectChat} onDeleteChat={onDeleteChat} refresh={lastUpdated} />
      <div className='w-full flex flex-col items-center p-6'>
        <div className='flex space-x-8'>
          <h1 className='text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-700 via-blue-700 to-white mb-8'>Vlad Chat</h1>
          <ModelDropdown onModelSelect={handleModelChange} />
        </div>
        {chatId ? (
          <Conversation chatId={chatId} model={selectedModel} onUpdateChatName={onUpdateChildName} />
        ) : (
          <img src={logo} alt='Vlad Chat logo' className='size-96 rounded-4xl' />
        )}
      </div>
    </div>
  );
}

export default App;
