import {
  createAction,
  createReducer,
  on,
  props,
  type ActionCreator,
  type ActionReducer
} from '@ngrx/store';
import type { ChatRecord } from './chatroom.interface';

export interface ChatroomInitialState {
  id?: string | undefined;
  chatRecord: Array<ChatRecord>; // 聊天记录
}

export interface SetIdProps {
  id: string;
}

export interface SetChatRecordProps {
  data: ChatRecord;
}

export const setId: ActionCreator<string, any> = createAction('[chatroom] Set id', props<SetIdProps>());
export const setChatRecord: ActionCreator<string, any>
  = createAction('[chatroom] 添加聊天记录', props<SetChatRecordProps>());

export const chatroomReducer: ActionReducer<ChatroomInitialState> = createReducer(
  { chatRecord: [] },

  on<ChatroomInitialState, any>(setId, function(state: ChatroomInitialState, propsData: SetIdProps): ChatroomInitialState {
    return {
      ...state,
      id: propsData.id
    };
  }),

  on<ChatroomInitialState, any>(setChatRecord, function(state: ChatroomInitialState, propsData: SetChatRecordProps): ChatroomInitialState {
    return {
      ...state,
      chatRecord: [...state.chatRecord, propsData.data]
    };
  })
);