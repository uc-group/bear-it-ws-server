import { Socket } from 'socket.io';
import type User from './User';

export interface IClient {
  readonly user: User,
  destroy: () => void
}

export default class Client implements IClient {
  constructor(public readonly socket: Socket, public readonly user: User) {
    user.addClient(this);
  }

  public destroy() {
    this.user.removeClient(this);
  }
}
