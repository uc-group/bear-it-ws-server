import type { IRoom } from '../../src/room/Room';
import Chat, { ChatMessage, MessageMessage } from '../../src/systems/Chat';
import User from '../../src/client/User';
import { IClient } from '../../src/client/Client';
import { ChatApi } from '../../src/systems/ChatApi';
import { setLevel as loggerLevel } from '../../src/logger';

jest.mock('socket.io');

const createRoomMock = (id: string): IRoom => ({
  id,
  emit: jest.fn(),
  addListener: jest.fn(),
  getUserIds: jest.fn(),
  getUsers: jest.fn(),
});

const createClientMock = (userId: string): IClient => ({
  user: new User(userId),
  destroy: jest.fn(),
});

type EventHandler<T extends any[]> = (...args: T) => void;

const getEventHandler = <T extends any[]>(
  system: Chat, room: IRoom, client: IClient, name: string,
): EventHandler<T> => {
  const events = system.getEvents(room, client);
  const definition = events.find((def) => def.name === name);
  if (!definition) {
    throw new Error(`Event ${name} definition not found`);
  }

  return definition.handler as unknown as EventHandler<T>;
};

describe('Chat system', () => {
  let apiMock: ChatApi;
  const now = Date.now();

  beforeAll(() => {
    loggerLevel('warn');
  });

  beforeEach(() => {
    apiMock = {
      editMessage: jest.fn().mockImplementation(() => Promise.resolve({
        id: 'messageID',
        author: 'testuser',
        content: 'new message',
        postedAt: now,
        room: 'chat/test',
      })),
      loadMessages: jest.fn().mockImplementation(() => Promise.resolve([
        {
          id: 'messageID',
          author: 'testuser',
          content: 'old message',
          postedAt: now,
          room: 'chat/test',
        },
      ])),
      pushMessages: jest.fn(),
      removeMessage: jest.fn(),
    };
  });

  describe('new message', () => {
    let handler: EventHandler<[MessageMessage]>;
    let room: IRoom;
    let chatSystem: Chat;

    beforeEach(async () => {
      chatSystem = new Chat(apiMock, {
        flushQueueDelay: 20,
      });
      room = createRoomMock('chat/test');
      const client = createClientMock('testuser');
      handler = getEventHandler<[MessageMessage]>(chatSystem, room, client, 'message');
      await chatSystem.wakeup(room);
    });

    afterEach(async () => {
      await chatSystem.sleep(room);
    });

    test('is broadcasted to room members', async () => {
      const emitMock = room.emit as jest.Mock<void>;
      const currentTime = Date.now();

      await handler({
        content: 'another message',
        id: 'messageID + 1',
      });

      expect(emitMock.mock.calls.length).toBe(1);
      expect(emitMock.mock.calls[0][0]).toBe('message');
      expect(emitMock.mock.calls[0][1]).toStrictEqual({
        id: 'messageID + 1',
        author: 'testuser',
        content: 'another message',
        postedAt: currentTime,
        room: 'chat/test',
      });
    });

    test('is applied in cached list sent to connecting clients', async () => {
      let response = await chatSystem.onClientJoined(room);
      expect(response.messages[0]).toStrictEqual({
        id: 'messageID',
        author: 'testuser',
        content: 'old message',
        postedAt: now,
        room: 'chat/test',
      });

      const currentTime = Date.now();
      await handler({
        content: 'another message',
        id: 'messageID + 1',
      });

      response = await chatSystem.onClientJoined(room);
      expect(response.messages.length).toBe(2);
      expect(response.messages[1]).toStrictEqual({
        id: 'messageID + 1',
        author: 'testuser',
        content: 'another message',
        postedAt: currentTime,
        room: 'chat/test',
      });
    });

    test('sends batch messages to api when added in short period of time', async () => {
      const pushMessagesMock = apiMock.pushMessages as jest.Mock<Promise<void>>;
      await handler({
        content: 'first message',
        id: '1',
      });
      await handler({
        content: 'second message',
        id: '2',
      });
      await handler({
        content: 'third message',
        id: '3',
      });

      await new Promise<void>((resolve) => setTimeout(() => {
        expect(pushMessagesMock.mock.calls.length).toBe(1);
        expect(pushMessagesMock.mock.calls[0][0].length).toBe(3);
        resolve();
      }, 25));
    });
  });

  test('pending messages to send to api are sent when chat goes sleep', async () => {
    const chatSystem = new Chat(apiMock, {
      flushQueueDelay: 100,
    });
    const room = createRoomMock('chat/test');
    const client = createClientMock('testuser');
    const handler = getEventHandler<[MessageMessage]>(chatSystem, room, client, 'message');
    await chatSystem.wakeup(room);

    const pushMessagesMock = apiMock.pushMessages as jest.Mock<Promise<void>>;
    await handler({
      content: 'first message',
      id: '1',
    });
    await handler({
      content: 'second message',
      id: '2',
    });
    await handler({
      content: 'third message',
      id: '3',
    });

    await chatSystem.sleep(room);
    expect(pushMessagesMock.mock.calls.length).toBe(1);
    expect(pushMessagesMock.mock.calls[0][0].length).toBe(3);
  });

  describe('edited message', () => {
    let handler: EventHandler<[MessageMessage]>;
    let room: IRoom;
    let chatSystem: Chat;

    beforeEach(async () => {
      chatSystem = new Chat(apiMock);
      room = createRoomMock('chat/test');
      const client = createClientMock('testuser');
      handler = getEventHandler<[MessageMessage]>(chatSystem, room, client, 'edit-message');
      await chatSystem.wakeup(room);
    });

    afterEach(() => {
    });

    test('is sent to api', async () => {
      const apiEditMessageMock = apiMock.editMessage as jest.Mock<Promise<ChatMessage>>;
      await handler({
        content: 'new message',
        id: 'messageID',
      });

      expect(apiEditMessageMock.mock.calls.length).toBe(1);
      expect(apiEditMessageMock.mock.calls[0][0]).toBe('testuser');
      expect(apiEditMessageMock.mock.calls[0][1]).toBe('messageID');
      expect(apiEditMessageMock.mock.calls[0][2]).toBe('new message');
    });

    test('is broadcasted to room members', async () => {
      const emitMock = room.emit as jest.Mock<void>;
      await handler({
        content: 'new message',
        id: 'messageID',
      });

      expect(emitMock.mock.calls.length).toBe(1);
      expect(emitMock.mock.calls[0][0]).toBe('message-updated');
      expect(emitMock.mock.calls[0][1]).toStrictEqual({
        id: 'messageID',
        author: 'testuser',
        content: 'new message',
        postedAt: now,
        room: 'chat/test',
      });
    });

    test('is applied in cached list sent to connecting clients', async () => {
      let response = await chatSystem.onClientJoined(room);
      expect(response.messages[0]).toStrictEqual({
        id: 'messageID',
        author: 'testuser',
        content: 'old message',
        postedAt: now,
        room: 'chat/test',
      });

      await handler({
        content: 'new message',
        id: 'messageID',
      });

      response = await chatSystem.onClientJoined(room);
      expect(response.messages[0]).toStrictEqual({
        id: 'messageID',
        author: 'testuser',
        content: 'new message',
        postedAt: now,
        room: 'chat/test',
      });
    });
  });

  describe('removed message', () => {
    let handler: EventHandler<[string]>;
    let room: IRoom;
    let chatSystem: Chat;

    beforeEach(async () => {
      chatSystem = new Chat(apiMock);
      room = createRoomMock('chat/test');
      const client = createClientMock('testuser');
      handler = getEventHandler<[string]>(chatSystem, room, client, 'remove-message');
      await chatSystem.wakeup(room);
    });

    test('is sent to api', async () => {
      const apiRemoveMessageMock = apiMock.removeMessage as jest.Mock<Promise<void>>;
      await handler('messageID');
      expect(apiRemoveMessageMock.mock.calls.length).toBe(1);
      expect(apiRemoveMessageMock.mock.calls[0][0]).toBe('messageID');
    });

    test('is broadcasted to room members', async () => {
      const emitMock = room.emit as jest.Mock<void>;
      await handler('messageID');
      expect(emitMock.mock.calls.length).toBe(1);
      expect(emitMock.mock.calls[0][0]).toBe('message-removed');
      expect(emitMock.mock.calls[0][1]).toBe('messageID');
    });

    test('is applied in cached list sent to connecting clients', async () => {
      let response = await chatSystem.onClientJoined(room);
      expect(response.messages[0]).toStrictEqual({
        id: 'messageID',
        author: 'testuser',
        content: 'old message',
        postedAt: now,
        room: 'chat/test',
      });

      await handler('messageID');

      response = await chatSystem.onClientJoined(room);
      expect(response.messages.length).toBe(0);
    });
  });
});
