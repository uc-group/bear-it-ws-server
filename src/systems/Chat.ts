import { Server } from 'socket.io';
import Client from '../client/Client';
import User from '../client/User';
import Room from '../room/Room';
import System, { SystemEvent } from './System';

interface JoinResponse {
  users: string[],
  messages: string[]
}

interface MessageMessage {
  content: string,
  id: string
}

export default class Chat implements System<JoinResponse, void>
{
  getEvents(room: Room, client: Client) {
    return [
      {
        name: 'message',
        handler: ({content, id}: MessageMessage) => {
          const user = client.user.id
          const date = Date.now();
          room.emit('message', { content, id, user, date })
        }
      }
    ];
  }

  onAttach(room: Room): void {
    room.addListener('newUserJoined', (user: User) => {
      room.emit('user-list', room.getUserIds())
    });
    room.addListener('userLeft', (user: User) => {
      room.emit('user-list', room.getUserIds())
    });
  }

  id(): string {
    return 'chat';
  }

  supportsRoom(room: Room): boolean {
    return /^chat\//.test(room.id)
  }

  async onClientJoined(room: Room, client: Client): Promise<JoinResponse> {
    return {
      users: room.getUserIds(),
      messages: []
    }
  }

  async onClientLeft(room: Room, client: Client): Promise<void> {}
  
}