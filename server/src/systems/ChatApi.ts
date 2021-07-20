/* eslint-disable class-methods-use-this */
import { CancelToken } from 'axios';
import type { ChatMessage } from './Chat';
import * as Api from '../Api';

export interface ChatApi {
  editMessage(author: string, id: string, content: string): Promise<ChatMessage>
  pushMessages(messages: ChatMessage[]): Promise<void>
  loadMessages(roomId: string, cancelToken?: CancelToken): Promise<ChatMessage[]>
  removeMessage(author: string, id: string): Promise<void>
}

export default class RestApi implements ChatApi {
  removeMessage(author: string, id: string): Promise<void> {
    return Api.post('chat/remove-message', {
      id,
      author,
    });
  }

  editMessage(author: string, id: string, content: string): Promise<ChatMessage> {
    return Api.put('chat/message', {
      content,
      id,
      author,
    });
  }

  pushMessages(messages: ChatMessage[]): Promise<void> {
    return Api.post('chat/messages', messages);
  }

  loadMessages(roomId: string, cancelToken?: CancelToken): Promise<ChatMessage[]> {
    return Api.get(`chat/messages?room=${encodeURIComponent(roomId)}`, {
      cancelToken,
    });
  }
}
