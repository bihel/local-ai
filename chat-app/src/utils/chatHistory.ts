import { Chat } from "../models";

export const saveChatHistory = (chatHistory: Chat[]) => {
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
};

export const getChatHistory = (): Chat[] => {
  const chatHistory = localStorage.getItem("chatHistory");
  return chatHistory ? JSON.parse(chatHistory) : [];
};

export const getChatById = (chatId: string): Chat | undefined => {
  const chatHistory = getChatHistory();
  return chatHistory.find(chat => chat.id === chatId);
};

export const deleteChatHistory = (chatId: string) => {
  const chatHistory = getChatHistory();
  const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
  saveChatHistory(updatedHistory);
};

export const addNewChat = (chat: Chat) => {
  const chatHistory = getChatHistory();
  chatHistory.unshift(chat);
  saveChatHistory(chatHistory);
};

export const updateChat = (chat: Chat) => {
  const chatHistory = getChatHistory();
  const chatIndex = chatHistory.findIndex(c => c.id === chat.id);
  chatHistory[chatIndex] = chat;
  saveChatHistory(chatHistory);
};
