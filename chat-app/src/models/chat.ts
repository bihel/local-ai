import { Message } from "./Message";

export type Chat = {
  id: string;
  name: string;
  messages: Message[];
};
