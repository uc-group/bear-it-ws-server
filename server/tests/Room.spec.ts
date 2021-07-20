import { createServer } from 'http';
import { AddressInfo } from 'net';
import { Server, Socket } from 'socket.io';
import { io as IOClient, Socket as ClientSocket } from 'socket.io-client';
import Client from '../src/client/Client';
import User from '../src/client/User';
import { setLevel as loggerLevel } from '../src/logger';
import System from '../src/systems/System';
import Room from '../src/room/Room';

describe('room connecting', () => {
  let io: Server;
  let serverSocket: Socket;
  let newClientConnection: () => Promise<ClientSocket>;
  const clients: ClientSocket[] = [];

  beforeAll((done) => {
    loggerLevel('warn');
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const { port } = httpServer.address() as AddressInfo;
      newClientConnection = () => new Promise<ClientSocket>((resolve) => {
        const socket = IOClient(`http://localhost:${port}`);
        socket.on('connect', () => {
          clients.push(socket);
          resolve(socket);
        });
      });
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      newClientConnection().then(() => {
        done();
      });
    });
  });

  afterAll(() => {
    io.close();
    clients.forEach((c) => c.close());
  });

  test('attaches system to the room', () => {
    const system: System = {
      id() {
        return 'test-system';
      },
      supportsRoom() {
        return true;
      },
      async onAttach() { /* empty */ },
      async onClientJoined() { /* empty */ },
      async onClientLeft() { /* empty */ },
      async sleep() { /* empty */ },
      async wakeup() { /* empty */ },
      getEvents() { return []; },
    };

    const room = new Room('test', io);
    room.attachSystem(system);

    expect(room.hasSystem('test-system')).toBe(true);
  });

  test('connects client', async () => {
    const room = new Room('test', io);
    const client = new Client(serverSocket, new User('testuser'));
    await room.addClient(client);
    expect(room.isClientInRoom(client)).toBe(true);
  });

  test('wakeups system exactly once when first client is connected (one after another)', async () => {
    const wakeup = jest.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 500)));
    const system: System = {
      id() {
        return 'test-system';
      },
      supportsRoom() {
        return true;
      },
      async onAttach() { /* empty */ },
      async onClientJoined() { /* empty */ },
      async onClientLeft() { /* empty */ },
      async sleep() { /* empty */ },
      wakeup,
      getEvents() { return []; },
    };

    const room = new Room('test', io);
    room.attachSystem(system);
    const client1 = new Client(serverSocket, new User('testuser'));
    await newClientConnection();
    const client2 = new Client(serverSocket, new User('seconduser'));

    expect(client1.socket.id).not.toBe(client2.socket.id);

    await room.addClient(client1);
    await room.addClient(client2);

    expect(wakeup.mock.calls.length).toBe(1);
  });

  test('wakeups system exactly once when first client is connected (two clients connect simultaneously)', async () => {
    const wakeup = jest.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 500)));
    const system: System = {
      id() {
        return 'test-system';
      },
      supportsRoom() {
        return true;
      },
      async onAttach() { /* empty */ },
      async onClientJoined() { /* empty */ },
      async onClientLeft() { /* empty */ },
      async sleep() { /* empty */ },
      wakeup,
      getEvents() { return []; },
    };

    const room = new Room('test', io);
    room.attachSystem(system);
    const client1 = new Client(serverSocket, new User('testuser'));
    await newClientConnection();
    const client2 = new Client(serverSocket, new User('seconduser'));

    expect(client1.socket.id).not.toBe(client2.socket.id);

    await Promise.all([
      room.addClient(client1),
      room.addClient(client2),
    ]);

    expect(wakeup.mock.calls.length).toBe(1);
  });

  test('returns users connected to the room', async () => {
    const room = new Room('test', io);
    const client1 = new Client(serverSocket, new User('testuser'));
    await newClientConnection();
    const client2 = new Client(serverSocket, new User('seconduser'));
    expect(client1.socket.id).not.toBe(client2.socket.id);

    let response = await room.addClient(client1);
    expect(response).toStrictEqual({ users: [client1.user.id] });
    response = await room.addClient(client2);
    expect(response).toStrictEqual({ users: [client1.user.id, client2.user.id] });
  });

  test('returns systems data built on wakeup (two clients connect simultaneously)', async () => {
    type OnJoinResponse = { a: number, b:number };
    const system: { someData: OnJoinResponse | null } & System<OnJoinResponse | null> = {
      someData: null,
      id() {
        return 'test-system';
      },
      supportsRoom() {
        return true;
      },
      async onAttach() { /* empty */ },
      async onClientJoined() { return this.someData; },
      async onClientLeft() { /* empty */ },
      async sleep() { /* empty */ },
      wakeup() {
        return new Promise<void>((resolve) => setTimeout(() => {
          this.someData = {
            a: 1,
            b: 2,
          };
          resolve();
        }, 500));
      },
      getEvents() { return []; },
    };

    const room = new Room('test', io);
    room.attachSystem(system);
    const client1 = new Client(serverSocket, new User('testuser'));
    await newClientConnection();
    const client2 = new Client(serverSocket, new User('seconduser'));

    expect(client1.socket.id).not.toBe(client2.socket.id);

    const responses = await Promise.all([
      room.addClient(client1),
      room.addClient(client2),
    ]);

    expect(responses[0]['test-system']).toStrictEqual({ a: 1, b: 2 });
    expect(responses[1]['test-system']).toStrictEqual({ a: 1, b: 2 });
  });
});
