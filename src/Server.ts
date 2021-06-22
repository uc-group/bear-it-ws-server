import { ParsedUrlQuery } from 'querystring';
import { Server as SocketIoServer } from 'socket.io';
import Auth from './auth/Auth';
import Client from './client/Client';
import Room from './room/Room';
import System from './systems/System';

interface RoomMessage {
  roomId: string
}

export default class Server {
  private rooms: Room[] = [];
  private started: boolean = false;
  private clients: Record<string, Client> = {};
  private systems: System<any, any>[] = [];

  constructor(
    private io: SocketIoServer,
    private auth: Auth
  ) {}

  public registerSystem<J,L>(system: System<J, L>) {
    this.systems.push(system);
    this.rooms.forEach((room) => {
      if (system.supportsRoom(room)) {
        room.attachSystem(system);
      }
    })
  }

  public getRoom(id: string) {
    let room = this.rooms.find((r) => r.id === id);
    if (!room) {
      console.log(`Room ${id} not found. Creating.`)
      room = new Room(id, this.io);
      this.systems.forEach((system) => {
        if (system.supportsRoom(room)) {
          room.attachSystem(system)
          console.log(`System ${system.id()} attached to room ${id}`);
        }
      });

      this.rooms.push(room);
    }

    return room;
  }

  public start(): void
  {
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
          await Promise.all(this.rooms.map((room) => client.leaveRoom(room)));
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

      socket.on('join-room', async ({roomId}: RoomMessage, callback) => {
        const client = this.clients[socket.id];
        const response = await client.joinRoom(this.getRoom(roomId));
        if (typeof callback === 'function') {
          callback(response);
        }
      })

      socket.on('leave-room', async ({roomId}: RoomMessage, callback) => {
        const client = this.clients[socket.id];
        const response = client.leaveRoom(this.getRoom(roomId));
        if (typeof callback === 'function') {
          callback(response);
        }
      })

      socket.emit('connection-ready');
    })
  }
}