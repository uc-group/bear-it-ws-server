import { CancelToken } from 'axios';
import type { ChatMessage } from './Chat';
import * as Api from '../Api';

export interface ChatApi {
  editMessage(author: string, id: string, content: string): Promise<ChatMessage>
  pushMessages(messages: ChatMessage[]): Promise<void>
  loadMessages(roomId: string, cancelToken?: CancelToken): Promise<ChatMessage[]>
  removeMessage(id: string): Promise<void>
}

export default class RestApi implements ChatApi {
  constructor(private apiUrl: string) {}

  removeMessage(id: string): Promise<void> {
    return Api.doDelete(`${this.apiUrl}/api/chat/message/${id}`);
  }

  editMessage(author: string, id: string, content: string): Promise<ChatMessage> {
    return Api.put(`${this.apiUrl}/api/chat/message`, {
      content,
      id,
      author,
    });
  }

  pushMessages(messages: ChatMessage[]): Promise<void> {
    return Api.post(`${this.apiUrl}/chat/messages`, messages);
  }

  loadMessages(roomId: string, cancelToken?: CancelToken): Promise<ChatMessage[]> {
    return Api.get(`${this.apiUrl}/chat/messages?room=${encodeURIComponent(roomId)}`, {
      cancelToken,
    });
  }
}
