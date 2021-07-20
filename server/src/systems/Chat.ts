import { debounce, DebouncedFunc } from 'lodash';
import axios, { CancelTokenSource } from 'axios';
import type { IRoom } from '../room/Room';
import System, { SystemEvent } from './System';
import SystemLogger from './SystemLogger';
import type { ChatApi } from './ChatApi';
import type { IClient } from '../client/Client';

interface JoinResponse {
  messages: ChatMessage[]
}

export interface MessageMessage {
  content: string,
  id: string
}

export interface ChatMessage {
  id: string,
  postedAt: number,
  content: string,
  author: string,
  room: string,
}

export type ChatSystemOptions = {
  flushQueueDelay: number
};

export default class Chat implements System<JoinResponse, void> {
  private messages: Record<string, ChatMessage[]> = {};

  private messageQueue: ChatMessage[] = [];

  private cancelTokenSource = new Map<string, CancelTokenSource>();

  private logger = new SystemLogger(this);

  public options: ChatSystemOptions = {
    flushQueueDelay: 1000,
  };

  constructor(private api: ChatApi, options: Partial<ChatSystemOptions> = {}) {
    this.options = { ...this.options, ...options };
  }

  async sleep(room: IRoom): Promise<void> {
    this.logger.debug('sleep', [room.id]);
    if (this.cancelTokenSource.has(room.id)) {
      this.logger.debug('aborted loading messages...', [room.id]);
      this.cancelTokenSource.get(room.id)?.cancel();
      this.cancelTokenSource.delete(room.id);
    }

    if (Object.hasOwnProperty.call(this.messages, room.id)) {
      delete this.messages[room.id];
    }

    if (this.debouncedFlushQueue) {
      await this.debouncedFlushQueue.flush();
    }
  }

  async wakeup(room: IRoom): Promise<void> {
    if (this.cancelTokenSource.has(room.id)) {
      this.logger.debug('aborted loading messages...');
      this.cancelTokenSource.get(room.id)?.cancel();
      this.cancelTokenSource.delete(room.id);
    }
    this.logger.debug('Waking up chat system...');
    await this.loadMessages(room);
    this.logger.debug('messages loaded...');
  }

  getEvents(room: IRoom, client: IClient) {
    return [
      {
        name: 'message',
        handler: ({ content, id }, callback?: () => void) => {
          const author = client.user.id;
          const postedAt = Date.now();
          const message = {
            content, id, author, postedAt, room: room.id,
          } as ChatMessage;

          this.messages[room.id].push(message);
          this.saveMessage(message);
          room.emit<[ChatMessage]>('message', message);
          if (callback) {
            callback();
          }
        },
      } as SystemEvent<[MessageMessage]>,
      {
        name: 'edit-message',
        handler: async ({ content, id }, callback?: (message: ChatMessage) => void) => {
          const author = client.user.id;
          const message = await this.api.editMessage(author, id, content);
          const index = this.messages[room.id]?.findIndex((m) => m.id === message.id);
          if (index !== -1 && index !== undefined) {
            this.messages[room.id].splice(index, 1, message);
          }
          room.emit<[ChatMessage]>('message-updated', message);
          if (callback) {
            callback(message);
          }
        },
      } as SystemEvent<[MessageMessage]>,
      {
        name: 'remove-message',
        handler: async (id, callback?: () => void) => {
          await this.api.removeMessage(id);
          room.emit<[string]>('message-removed', id);
          const index = this.messages[room.id]?.findIndex((m) => m.id === id);
          if (index !== -1 && index !== undefined) {
            this.messages[room.id].splice(index, 1);
          }
          if (callback) {
            callback();
          }
        },
      } as SystemEvent<[string]>,
    ];
  }

  // eslint-disable-next-line class-methods-use-this
  async onAttach(room: IRoom): Promise<void> {
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
  supportsRoom(room: IRoom): boolean {
    return /^chat\//.test(room.id);
  }

  onClientJoined(room: IRoom): Promise<JoinResponse> {
    return Promise.resolve({
      messages: this.messages[room.id] || [],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, class-methods-use-this
  async onClientLeft(): Promise<void> {}

  private async loadMessages(room: IRoom) {
    this.logger.debug(`Loading messages for room ${room.id}...`);
    this.messages[room.id] = await new Promise<ChatMessage[]>((resolve) => {
      this.cancelTokenSource.set(room.id, axios.CancelToken.source());
      this.api.loadMessages(
        room.id,
        this.cancelTokenSource.get(room.id)?.token,
      ).then((messages) => {
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

  public debouncedFlushQueue: (DebouncedFunc<() => Promise<void>>) | undefined = undefined;

  private flushQueue = () => {
    if (!this.debouncedFlushQueue) {
      this.debouncedFlushQueue = debounce(async () => {
        const data = JSON.parse(JSON.stringify(this.messageQueue)) as ChatMessage[];
        this.messageQueue = [];

        if (data.length === 0) {
          return;
        }

        try {
          await this.api.pushMessages(data);
        } catch (e) {
          this.messageQueue = [...data, ...this.messageQueue];
        }
        this.debouncedFlushQueue = undefined;
      }, this.options.flushQueueDelay);
    }

    this.debouncedFlushQueue();
  };
}
