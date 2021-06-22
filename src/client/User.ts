import Room from '../room/Room';
import Client from './Client';

export default class User {
  private clients: Client[] = []

  constructor(public readonly id: string) {}

  public addClient(client: Client) {
    this.clients.push(client)
  }

  public removeClient(client: Client) {
    this.clients = this.clients.filter((c) => c.socket.id === client.socket.id)
  }

  public equals(user: User)
  {
    return this.id === user.id;
  }
}