import { debounce } from 'lodash';
import axios, { CancelTokenSource } from 'axios';
import type Client from '../client/Client';
import type Room from '../room/Room';
import System, { SystemEvent } from './System';
import * as Api from '../Api';
import SystemLogger from './SystemLogger';

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

  private cancelTokenSource = new Map<string, CancelTokenSource>();

  private logger = new SystemLogger(this);

  constructor(private apiUrl: string) {}

  async sleep(room: Room): Promise<void> {
    this.logger.debug('sleep', [room.id]);
    if (this.cancelTokenSource.has(room.id)) {
      this.logger.debug('aborted loading messages...', [room.id]);
      this.cancelTokenSource.get(room.id)?.cancel();
      this.cancelTokenSource.delete(room.id);
    }

    if (Object.hasOwnProperty.call(this.messages, room.id)) {
      delete this.messages[room.id];
    }
  }

  async wakeup(room: Room): Promise<void> {
    if (this.cancelTokenSource.has(room.id)) {
      this.logger.debug('aborted loading messages...');
      this.cancelTokenSource.get(room.id)?.cancel();
      this.cancelTokenSource.delete(room.id);
    }
    this.logger.debug('Waking up chat system...');
    await this.loadMessages(room);
    this.logger.debug('messages loaded...');
  }

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

  // eslint-disable-next-line class-methods-use-this
  async onAttach(room: Room): Promise<void> {
    room.addListener('newUserJoined', () => {
      room.emit('user-list', room.getUserIds());
    });
    room.addListener('userLeft', () => {
      room.emit('user-list', room.getUserIds());
    });
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
    this.logger.debug(`Loading messages for room ${room.id}...`);
    this.messages[room.id] = await new Promise<ChatMessage[]>((resolve) => {
      this.cancelTokenSource.set(room.id, axios.CancelToken.source());
      Api.get<ChatMessage[]>(`${this.apiUrl}/chat/messages?room=${room.id}`, {
        cancelToken: this.cancelTokenSource.get(room.id)?.token,
      }).then((messages) => {
        this.messages[room.id] = messages;
        this.logger.debug(`Loaded ${messages.length} messages`);
        this.cancelTokenSource.delete(room.id);

        resolve(messages);
      }).catch((e) => {
        if (axios.isCancel(e)) {
          this.logger.debug('Cancelled loading messages');
        } else {
          this.logger.error(e);
        }
        this.cancelTokenSource.delete(room.id);

        resolve([]);
      });
    });
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
