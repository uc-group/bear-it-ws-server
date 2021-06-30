import type Client from '../client/Client';
import type Room from '../room/Room';

export interface SystemEvent<T extends [...any]> {
  name: string,
  handler: (...args: T) => void
}

export default interface System<JoinResponse = void, LeaveResponse = void> {
  id(): string
  supportsRoom(room: Room): boolean
  onAttach(room: Room): Promise<void>
  onClientJoined(room: Room, client: Client): Promise<JoinResponse>
  onClientLeft(room: Room, client: Client): Promise<LeaveResponse>
  getEvents(room: Room, client: Client): SystemEvent<any>[]
  sleep(room: Room): Promise<void>
  wakeup(room: Room): Promise<void>
}
