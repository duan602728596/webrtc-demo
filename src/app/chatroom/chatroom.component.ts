import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Channel } from 'pusher-js';
import { pusherInstance, pusherDestroy } from '../../utils/pusher';
import { WebRTC, webrtcGroup, type SetPusherAction, type MessageAction } from '../../utils/WebRTC';
import { getIceServer } from '../../utils/iceServer';
import { randomOnlyNum } from '../../utils/random';
import { setId, type InitialState } from './chatroom.reducer';
import { dataChannelMessageCallback } from './chatroom.callback';

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.sass']
})
export class ChatroomComponent implements OnInit {
  chatroom$State: InitialState | undefined;

  constructor(
    private store: Store<{ chatroom: InitialState }>
  ) { /* noop */ }

  ngOnInit(): void {
    const id: string = randomOnlyNum();
    const channel: Channel = pusherInstance(id);

    channel.bind('rtc-ask', this.handlerPusherRTCAskMessage);

    this.store.select('chatroom').subscribe((state: InitialState): unknown => this.chatroom$State = state);
    this.store.dispatch(setId({ id }));
  }

  ngOnDestroy(): void {
    this.chatroom$State?.id && pusherDestroy(this.chatroom$State.id);
  }

  // Pusher event message
  handlerPusherRTCAskMessage: Function = async (action: SetPusherAction): Promise<void> => {
    if (action.type === 'rtc-ask' && this.chatroom$State?.id) {
      let webrtc: WebRTC;
      const item: WebRTC | undefined = webrtcGroup.find(
        (o: WebRTC): boolean => o.targetId === action.payload.id);

      if (!item) {
        webrtc = new WebRTC({
          id: this.chatroom$State?.id,
          targetId: action.payload.id,
          token: action.payload.token,
          iceServer: await getIceServer(),
          onDataChannelMessage: (_rtc: WebRTC, msgAction: MessageAction): void => {
            dataChannelMessageCallback(this.store, _rtc, msgAction);
          }
        });
        await webrtc.confirm(action.payload.sdp);
        webrtcGroup.push(webrtc);
      }
    }
  };
}