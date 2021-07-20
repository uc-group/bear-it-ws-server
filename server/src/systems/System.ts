import type { IClient } from '../client/Client';
import type { IRoom } from '../room/Room';

export interface SystemEvent<T extends [...any]> {
  name: string,
  handler: (...args: T) => void
}

export default interface System<JoinResponse = void, LeaveResponse = void> {
  id(): string
  supportsRoom(room: IRoom): boolean
  onAttach(room: IRoom): Promise<void>
  onClientJoined(room: IRoom, client: IClient): Promise<JoinResponse>
  onClientLeft(room: IRoom, client: IClient): Promise<LeaveResponse>
  getEvents(room: IRoom, client: IClient): SystemEvent<any>[]
  sleep(room: IRoom): Promise<void>
  wakeup(room: IRoom): Promise<void>
}
