import type { ChatroomInitialState } from './chatroom/chatroom.reducer';

/* store的类型 */
export interface StoreRecord {
  chatroom: ChatroomInitialState;
}