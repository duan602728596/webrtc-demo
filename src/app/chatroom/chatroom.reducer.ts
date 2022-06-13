import {
  createAction,
  createReducer,
  on,
  props,
  type ActionCreator,
  type ActionReducer
} from '@ngrx/store';
import type { ChatRecord } from './chatroom.interface';

export interface InitialState {
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

export const chatroomReducer: ActionReducer<InitialState> = createReducer(
  { chatRecord: [] },

  on<InitialState, any>(setId, function(state: InitialState, propsData: SetIdProps): InitialState {
    return {
      ...state,
      id: propsData.id
    };
  }),

  on<InitialState, any>(setChatRecord, function(state: InitialState, propsData: SetChatRecordProps): InitialState {
    return {
      ...state,
      chatRecord: [...state.chatRecord, propsData.data]
    };
  })
);