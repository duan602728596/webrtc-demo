import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { pusherInstance, pusherDestroy } from '../../utils/pusher';
import { WebRTC, webrtcGroup, type SetPusherAction, type MessageAction } from '../../utils/WebRTC';
import { randomString } from '../../utils/randomString';
import { setId, type InitialState } from './chatroom.reducer';
import { dataChannelMessageCallback } from './chatroom.callback';

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.sass']
})
export class ChatroomComponent implements OnInit {
  constructor(
    private store: Store<{ chatroom: InitialState }>
  ) { /* noop */ }

  ngOnInit(): void {
    const id: string = randomString();
    const channel: any = pusherInstance(id);

    channel.bind('rtc-ask', this.handlerPusherRTCAskMessage);
    this.store.dispatch(setId({ id }));
  }

  ngOnDestroy(): void {
    this.store.select('chatroom').subscribe((state: InitialState): unknown => pusherDestroy(state.id!));
  }

  // Pusher event message
  handlerPusherRTCAskMessage: Function = (action: SetPusherAction): void => {
    if (action.type === 'rtc-ask') {
      this.store.select('chatroom').subscribe(async (state: InitialState): Promise<void> => {
        let webrtc: WebRTC;
        const item: WebRTC | undefined = webrtcGroup.find(
          (o: WebRTC): boolean => o.targetId === action.payload.id);

        if (!item) {
          webrtc = new WebRTC({
            id: state.id!,
            targetId: action.payload.id,
            token: action.payload.token,
            onDataChannelMessage: (_rtc: WebRTC, msgAction: MessageAction): void => {
              dataChannelMessageCallback(this.store, _rtc, msgAction);
            }
          });
          await webrtc.confirm(action.payload.sdp);
          webrtcGroup.push(webrtc);
        }
      });
    }
  };
}