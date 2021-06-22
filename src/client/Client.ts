import { stringify } from 'querystring';
import { Socket } from 'socket.io';
import Room from '../room/Room';
import User from './User';

export default class Client {
  constructor(public readonly socket: Socket, public readonly user: User) {
    user.addClient(this)
  }

  public destroy() {
    this.user.removeClient(this)
  }

  public async joinRoom(room: Room): Promise<Record<string, any>> {
    return room.addClient(this);
  }

  public async leaveRoom(room: Room): Promise<Record<string, any>> {
    return room.removeClient(this);
  }
}