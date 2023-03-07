import type { ChatroomInitialState } from './chatroom/chatroom.reducer';

/* store的类型 */
export type StoreRecord = {
  chatroom: ChatroomInitialState;
}