import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Channel } from 'pusher-js';
import { SendMessageComponent } from './send-message/send-message.component';
import { ChatMessageComponent } from './chat-message/chat-message.component';
import { pusherInstance, pusherDestroy } from '../../utils/pusher';
import { WebRTC, webrtcGroup, type SetPusherAction, type MessageAction } from '../../utils/WebRTC';
import { getIceServer } from '../../utils/iceServer';
import { randomOnlyNum } from '../../utils/random';
import { setId, type ChatroomInitialState } from './chatroom.reducer';
import { dataChannelMessageCallback } from './chatroom.callback';
import type { StoreRecord } from '../app.interface';

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.sass'],
  standalone: true,
  imports: [
    SendMessageComponent,
    ChatMessageComponent
  ]
})
export class ChatroomComponent implements OnInit {
  chatroom$State: ChatroomInitialState | undefined;

  constructor(
    private store: Store<StoreRecord>
  ) { /* noop */ }

  ngOnInit(): void {
    const id: string = randomOnlyNum();
    const channel: Channel = pusherInstance(id);

    channel.bind('rtc-ask', this.handlerPusherRTCAskMessage);

    this.store.select('chatroom').subscribe((state: ChatroomInitialState): unknown => this.chatroom$State = state);
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