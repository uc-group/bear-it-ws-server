import { debounce } from 'lodash';
import type Client from '../client/Client';
import type Room from '../room/Room';
import System, { SystemEvent } from './System';
import * as Api from '../Api';

interface JoinResponse {
  users: string[],
  messages: ChatMessage[]
}

interface MessageMessage {
  content: string,
  id: string
}

interface ChatMessage {
  id: string,
  postedAt: number,
  content: string,
  author: string,
  room: string,
}

export default class Chat implements System<JoinResponse, void> {
  private messages: Record<string, ChatMessage[]> = {};

  private messageQueue: ChatMessage[] = [];

  constructor(private apiUrl: string) {}

  getEvents(room: Room, client: Client) {
    return [
      {
        name: 'message',
        handler: ({ content, id }) => {
          const author = client.user.id;
          const postedAt = Date.now();
          const message = {
            content, id, author, postedAt, room: room.id,
          } as ChatMessage;

          this.messages[room.id].push(message);
          this.saveMessage(message);
          room.emit<[ChatMessage]>('message', message);
        },
      } as SystemEvent<[MessageMessage]>,
    ];
  }

  async onAttach(room: Room): Promise<void> {
    room.addListener('newUserJoined', () => {
      room.emit('user-list', room.getUserIds());
    });
    room.addListener('userLeft', () => {
      room.emit('user-list', room.getUserIds());
    });

    await this.loadMessages(room);
  }

  // eslint-disable-next-line class-methods-use-this
  id(): string {
    return 'chat';
  }

  // eslint-disable-next-line class-methods-use-this
  supportsRoom(room: Room): boolean {
    return /^chat\//.test(room.id);
  }

  async onClientJoined(room: Room): Promise<JoinResponse> {
    return {
      users: room.getUserIds(),
      messages: this.messages[room.id] || [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, class-methods-use-this
  async onClientLeft(): Promise<void> {}

  private async loadMessages(room: Room) {
    try {
      this.messages[room.id] = await Api.get<ChatMessage[]>(`${this.apiUrl}/chat/messages?room=${room.id}`) || [];
    } catch (e) {
      this.messages[room.id] = [];
    }
  }

  private saveMessage(message: ChatMessage) {
    this.messageQueue.push(message);
    this.flushQueue();
  }

  private flushQueue = debounce(async () => {
    const data = JSON.parse(JSON.stringify(this.messageQueue)) as ChatMessage[];
    this.messageQueue = [];

    if (data.length === 0) {
      return;
    }

    try {
      await Api.post(`${this.apiUrl}/chat/messages`, data);
    } catch (e) {
      this.messageQueue = [...data, ...this.messageQueue];
    }
  }, 1000);
}
