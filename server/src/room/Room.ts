import { Server } from 'socket.io';
import type Client from '../client/Client';
import type User from '../client/User';
import System from '../systems/System';

type UserListener = (user: User) => void;

type Listeners = {
  newUserJoined: UserListener,
  userLeft: UserListener
};

type RoomListeners = {
  newUserJoined: UserListener[],
  userLeft: UserListener[]
};

export default class Room {
  private clients: Client[] = []
  ;

  private systems: System<any, any>[] = [];

  private listeners: RoomListeners = {
    newUserJoined: [],
    userLeft: [],
  };

  constructor(
    public id: string,
    private io: Server,
  ) {}

  public async addClient(client: Client): Promise<Record<string, any>> {
    if (this.isClientInRoom(client)) {
      return {};
    }

    const usersBeforeJoin = this.getUsers();

    client.socket.join(this.id);
    this.clients.push(client);

    if (usersBeforeJoin.length !== this.getUsers().length) {
      this.listeners.newUserJoined.forEach((listener) => listener(client.user));
    }

    const keys = this.systems.map((system) => system.id());
    const promisses = this.systems.map((system) => system.onClientJoined(this, client));
    const values = await Promise.all(promisses);
    const result: Record<string, any> = {};
    keys.forEach((key, index) => {
      result[key] = values[index];
    });

    this.systems.forEach((system) => {
      system.getEvents(this, client).forEach((event) => {
        client.socket.on(`${this.id}/${event.name}`, event.handler);
      });
    });

    console.log(`Client ${client.socket.id} joined room ${this.id}`);

    return result;
  }

  public async attachSystem<J, L>(system: System<J, L>) {
    this.systems.push(system);
    await system.onAttach(this);
    this.clients.forEach((client) => {
      system.onClientJoined(this, client);
    });
  }

  public async removeClient(client: Client): Promise<Record<string, any>> {
    if (!this.isClientInRoom(client)) {
      return {};
    }

    this.systems.forEach((system) => {
      system.getEvents(this, client).forEach((event) => {
        client.socket.removeAllListeners(`${this.id}/${event.name}`);
      });
    });

    const usersBeforeLeave = this.getUsers();

    this.clients = this.clients.filter((c) => c.socket.id !== client.socket.id);
    client.socket.leave(this.id);

    if (usersBeforeLeave.length !== this.getUsers().length) {
      this.listeners.userLeft.forEach((listener) => listener(client.user));
    }

    const keys = this.systems.map((system) => system.id());
    const promisses = this.systems.map((system) => system.onClientLeft(this, client));
    const values = await Promise.all(promisses);
    const result: Record<string, any> = {};
    keys.forEach((key, index) => {
      result[key] = values[index];
    });

    console.log(`Client ${client.socket.id} left room ${this.id}`);

    return result;
  }

  public isClientInRoom(client: Client): boolean {
    return !!this.clients.find((m) => m.socket.id === client.socket.id);
  }

  public getUsers(): readonly User[] {
    const users: User[] = [];
    this.clients.forEach((c) => {
      const user = users.find((u) => u.equals(c.user));
      if (!user) {
        users.push(c.user);
      }
    });

    return users;
  }

  public getUserIds(): string[] {
    return this.getUsers().map((user) => user.id);
  }

  public emit<T extends any[]>(eventName: string, ...args: T) {
    this.io.to(this.id).emit(`${this.id}/${eventName}`, ...args);
  }

  public addListener<T extends keyof Listeners>(name: T, listener: Listeners[T]) {
    this.listeners[name].push(listener);
  }
}
