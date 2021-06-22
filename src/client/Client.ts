import { Socket } from 'socket.io';
import type User from './User';

export default class Client {
  constructor(public readonly socket: Socket, public readonly user: User) {
    user.addClient(this);
  }

  public destroy() {
    this.user.removeClient(this);
  }
}
