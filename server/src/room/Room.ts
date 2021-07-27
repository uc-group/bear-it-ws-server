import { Server } from 'socket.io';
import CancelToken from '../CancelToken';
import type Client from '../client/Client';
import type User from '../client/User';
import System from '../systems/System';
import logger from '../logger';

type UserListener = (user: User) => void;

type Listeners = {
  newUserJoined: UserListener,
  userLeft: UserListener
};

type RoomListeners = {
  newUserJoined: UserListener[],
  userLeft: UserListener[]
};

export interface IRoom {
  id: string,
  emit: <T extends any[]>(eventName: string, ...args: T) => void,
  getUsers: () => Readonly<User>[]
  getUserIds: () => string[]
  addListener: <T extends keyof Listeners>(name: T, listener: Listeners[T]) => void
}

export default class Room implements IRoom {
  private clients: Client[] = [];

  private awake: boolean = false;

  private systems: System<any, any>[] = [];

  private wakeupPromise?: Promise<void>;

  private joiningClientCancelTokens = new Map<string, CancelToken>();

  private listeners: RoomListeners = {
    newUserJoined: [],
    userLeft: [],
  };

  constructor(
    public id: string,
    private io: Server,
  ) {}

  public async addClient(client: Client): Promise<Record<string, any>> {
    const loggerContext = ['room.addClient', this.id, client.socket.id];
    logger.debug('adding client', loggerContext);
    if (this.isClientInRoom(client)) {
      logger.debug(`client ${client.socket.id} already in room`, loggerContext);
      if (!this.awake) {
        await this.wakeup();
      }

      return this.onClientJoined(client);
    }

    return new Promise((resolve, reject) => {
      const cancelToken = new CancelToken(reject);
      this.joiningClientCancelTokens.set(client.socket.id, cancelToken);
      logger.debug('cancel token created', loggerContext);

      (async () => {
        const usersBeforeJoin = this.getUsers();

        if (this.clients.length === 0) {
          await this.wakeup();
        }

        if (cancelToken.cancelled) {
          return;
        }

        client.socket.join(this.id);
        this.clients.push(client);

        if (usersBeforeJoin.length !== this.getUsers().length) {
          this.listeners.newUserJoined.forEach((listener) => listener(client.user));
        }

        const result = await this.onClientJoined(client);

        this.systems.forEach((system) => {
          system.getEvents(this, client).forEach((event) => {
            const eventName = `${this.id}/${event.name}`;
            if (!client.socket.listeners(eventName).length) {
              client.socket.on(eventName, event.handler);
            }
          });
        });

        logger.debug(`Client ${client.socket.id} joined room ${this.id}`);

        this.joiningClientCancelTokens.delete(client.socket.id);

        resolve(result);
      })();
    });
  }

  public async attachSystem<J, L>(system: System<J, L>) {
    this.systems.push(system);
    await system.onAttach(this);
    this.clients.forEach((client) => {
      system.onClientJoined(this, client);
    });
  }

  public async removeClient(client: Client): Promise<Record<string, any>> {
    const loggerContext = ['room.addClient', this.id, client.socket.id];
    this.joiningClientCancelTokens.get(client.socket.id)?.cancel(`Canceling client ${client.socket.id} joining room`);

    if (!this.isClientInRoom(client)) {
      logger.debug('client not in room', loggerContext);
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
    if (this.clients.length === 0) {
      await this.sleep();
    }

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

    logger.debug(`Client ${client.socket.id} left room ${this.id}`);

    return result;
  }

  public isClientInRoom(client: Client): boolean {
    return !!this.clients.find((m) => m.socket.id === client.socket.id);
  }

  public getUsers(): Readonly<User>[] {
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
    logger.debug(`emitting event "${this.id}/${eventName}"`, args);
    this.io.to(this.id).emit(`${this.id}/${eventName}`, ...args);
  }

  public addListener<T extends keyof Listeners>(name: T, listener: Listeners[T]) {
    this.listeners[name].push(listener);
  }

  public hasSystem(id: string): boolean {
    return !!this.systems.find((s) => s.id() === id);
  }

  private async onClientJoined(client: Client): Promise<Record<string, any>> {
    const keys = this.systems.map((system) => system.id());
    const promisses = this.systems.map((system) => system.onClientJoined(this, client));
    const values = await Promise.all(promisses);
    const result: Record<string, any> = {};
    keys.forEach((key, index) => {
      result[key] = values[index];
    });

    result.users = this.getUserIds();

    return result;
  }

  private async sleep(): Promise<void> {
    if (!this.awake) {
      return;
    }

    this.awake = false;
    await Promise.all(this.systems.map((system) => system.sleep(this)));
  }

  private async wakeup(): Promise<void> {
    if (this.awake) {
      return;
    }

    if (!this.wakeupPromise) {
      logger.debug('waking up room', [this.id]);
      this.wakeupPromise = Promise.all(
        this.systems.map((system) => system.wakeup(this)),
      ).then(() => {
        this.wakeupPromise = undefined;
        this.awake = true;
        logger.debug('room woke up', [this.id]);
      });
    }

    await this.wakeupPromise;
  }
}
