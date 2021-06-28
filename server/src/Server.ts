import { ParsedUrlQuery } from 'querystring';
import { Server as SocketIoServer } from 'socket.io';
import Auth from './auth/Auth';
import Client from './client/Client';
import Room from './room/Room';
import System from './systems/System';

interface RoomMessage {
  roomId: string
}

type RoomMessageCallback = (systemsData: Record<string, any>) => void;

export default class Server {
  private rooms: Room[] = [];

  private started: boolean = false;

  private clients: Record<string, Client> = {};

  private systems: System<any, any>[] = [];

  constructor(
    private io: SocketIoServer,
    private auth: Auth,
  ) { }

  public async registerSystem<J, L>(system: System<J, L>) {
    this.systems.push(system);
    await Promise.all(
      this.rooms.filter((room) => system.supportsRoom(room))
        .map((room) => room.attachSystem(system)),
    );
  }

  public async getRoom(id: string) {
    const room = this.rooms.find((r) => r.id === id);
    if (!room) {
      console.log(`Room ${id} not found. Creating.`);
      const newRoom = new Room(id, this.io);
      const supportedSystems = this.systems.filter((system) => system.supportsRoom(newRoom));
      await Promise.all(supportedSystems.map((system) => newRoom.attachSystem(system)));
      console.log(`System ${supportedSystems.map((system) => system.id()).join(', ')} attached to room ${id}`);

      this.rooms.push(newRoom);
      return newRoom;
    }

    return room;
  }

  public start(): void {
    if (this.started) {
      throw new Error('Server already started');
    }

    this.started = true;

    this.io.on('connection', async (socket) => {
      const { token } = socket.handshake.query as ParsedUrlQuery & { token: string };
      if (!token) {
        socket.disconnect();
        return;
      }

      socket.on('disconnect', async () => {
        const client = this.clients[socket.id];

        if (client) {
          await Promise.all(this.rooms.map((room) => room.removeClient(client)));
          client.destroy();
          delete this.clients[socket.id];
        }

        console.log(`Client ${socket.id} disconnected`);
      });

      try {
        const user = await this.auth.authenticate(token);
        const client = new Client(socket, user);
        this.clients[socket.id] = client;
        console.log(`Client ${socket.id} authenticated as ${client.user.id}`);
      } catch (e) {
        console.error(e);
        socket.disconnect();
        return;
      }

      socket.on('join-room', async ({ roomId }: RoomMessage, callback?: RoomMessageCallback) => {
        const client = this.clients[socket.id];
        const room = await this.getRoom(roomId);
        const response = await room.addClient(client);
        if (typeof callback === 'function') {
          callback(response);
        }
      });

      socket.on('leave-room', async ({ roomId }: RoomMessage, callback: RoomMessageCallback) => {
        const client = this.clients[socket.id];
        const room = await this.getRoom(roomId);
        const response = await room.removeClient(client);
        if (typeof callback === 'function') {
          callback(response);
        }
      });

      socket.emit('connection-ready');
    });
  }
}
