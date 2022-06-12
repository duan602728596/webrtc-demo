import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import copy from 'copy-to-clipboard';
import dayjs from 'dayjs';
import {
  WebRTC,
  webrtcGroup,
  type OnDataChannelMessage,
  type OnDisconnected,
  type MessageAction,
  type TextMessageAction
} from '../../../utils/WebRTC';
import { randomString } from '../../../utils/randomString';
import { dataChannelMessageCallback } from '../chatroom.callback';
import { setChatRecord, InitialState } from '../chatroom.reducer';

export const changeTargetIdEvent: Event = new Event('change-target-id-event');

@Component({
  selector: 'app-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.sass']
})
export class SendMessageComponent implements OnInit {
  chatroom$: Observable<InitialState>;
  chatroomState: InitialState | undefined;
  validateForm: FormGroup;
  loading: boolean = false;

  constructor(
    private store: Store<{ chatroom: InitialState }>,
    private fb: FormBuilder,
    private message: NzMessageService
  ) {
    this.chatroom$ = store.select('chatroom');
    this.validateForm = this.fb.group({
      sendMessage: [null, [Validators.required]],
      targetId: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.chatroom$.subscribe((state: InitialState): unknown => this.chatroomState = state);
    document.addEventListener(changeTargetIdEvent.type, this.handleChangeTargetId);
  }

  ngOnDestroy(): void {
    document.removeEventListener(changeTargetIdEvent.type, this.handleChangeTargetId);
  }

  /**
   * 发送文字消息
   * @param { WebRTC } webrtc
   */
  sendTextMessage(webrtc: WebRTC): void {
    const payload: TextMessageAction = {
      type: 'message',
      payload: {
        date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        text: this.validateForm.value.sendMessage,
        id: webrtc.id
      }
    };

    webrtc.sendMessage(payload);
    this.store.dispatch(setChatRecord({
      data: payload
    }));
  }

  /**
   * 发送图片
   * @param { WebRTC } webrtc
   * @param { FileList } files: 文件
   * @param { ArrayBuffer } arraybuffer: 图片的arraybuffer
   */
  sendImage(webrtc: WebRTC, files: FileList, arraybuffer: ArrayBuffer): void {
    const { name, size, type }: File = files[0];
    const date: string = dayjs().format('YYYY-MM-DD HH:mm:ss');

    webrtc.sendMessage({
      type: 'image-info',
      payload: { id: webrtc.targetId, name, size, type, date }
    });

    // 分片发送
    const partialSize: number = 1_024 * 20; // 每片大小
    const partial: number = Math.ceil(size / partialSize); // 上传次数

    for (let i: number = 0; i < partial; i++) {
      const sliceArraybuffer: ArrayBuffer = arraybuffer.slice(
        partialSize * i, i === partial - 1 ? size : partialSize * (i + 1));

      webrtc.sendBuffer(sliceArraybuffer);
    }

    this.loading = false;

    // 本地插入图片
    this.store.dispatch(setChatRecord({
      data: {
        type: 'image',
        payload: {
          date,
          url: URL.createObjectURL(new Blob([arraybuffer], { type })),
          id: webrtc.targetId
        }
      }
    }));
  }

  // RTC回调函数
  onDataChannelMessage: OnDataChannelMessage = (_rtc: WebRTC, msgAction: MessageAction): void => {
    dataChannelMessageCallback(this.store, _rtc, msgAction);
  };

  onDisconnected: OnDisconnected = (): void => {
    this.loading = false;
  };

  // 点击按钮发送消息
  async handleSendMessageClick(event: Event): Promise<void> {
    if (!this.validateForm.valid) {
      this.message.error('Please fill in message and target id first.');

      return;
    }

    if (this.chatroomState?.id === this.validateForm.value.targetId) {
      this.message.error('Can\'t send message to yourself.');

      return;
    }

    if (this.chatroomState?.id) {
      let webrtc: WebRTC;
      const item: WebRTC | undefined = webrtcGroup.find(
        (o: WebRTC): boolean => o.targetId === this.validateForm.value.targetId);

      if (item) {
        webrtc = item;
        this.sendTextMessage(webrtc);
        this.validateForm.setValue({
          sendMessage: ''
        });

        return;
      }

      this.loading = true;
      webrtc = new WebRTC({
        id: this.chatroomState.id,
        targetId: this.validateForm.value.targetId,
        token: randomString(30),
        onOpen: (_webrtc: WebRTC): void => {
          this.sendTextMessage(_webrtc);
          this.validateForm.reset({
            sendMessage: '',
            targetId: this.validateForm.value.targetId
          });
          this.loading = false;
        },
        onDataChannelMessage: this.onDataChannelMessage,
        onDisconnected: this.onDisconnected
      });
      await webrtc.init();
      webrtcGroup.push(webrtc);
    }
  }

  // Upload image
  handleImageUploadClick(event: Event): void {
    const target: HTMLInputElement = event.target as HTMLInputElement;

    if (!this.validateForm.value.targetId) {
      this.message.error('Please fill in target id first.');

      return;
    }

    if (this.chatroomState?.id === this.validateForm.value.targetId) {
      this.message.error('Can\'t send message to yourself.');

      return;
    }

    if (target.files?.length && this.chatroomState?.id && this.validateForm.value.targetId) {
      const reader: FileReader = new FileReader();

      reader.addEventListener('load', async (): Promise<void> => {
        // webrtc
        let webrtc: WebRTC;
        const item: WebRTC | undefined = webrtcGroup.find(
          (o: WebRTC): boolean => o.targetId === this.validateForm.value.targetId);

        if (item) {
          webrtc = item;
          this.sendImage(webrtc, target.files!, reader.result as ArrayBuffer);

          return;
        }

        this.loading = true;
        webrtc = new WebRTC({
          id: this.chatroomState!.id!,
          targetId: this.validateForm.value.targetId,
          token: randomString(30),
          onOpen: (_webrtc: WebRTC): void => {
            this.sendImage(webrtc, target.files!, reader.result as ArrayBuffer);
          },
          onDataChannelMessage: this.onDataChannelMessage,
          onDisconnected: this.onDisconnected
        });
        await webrtc.init();
        webrtcGroup.push(webrtc);
      });

      reader.readAsArrayBuffer(target.files[0]);
    }
  }

  // 修改targetId
  handleChangeTargetId: (event: Event) => void = (event: Event): void => {
    this.validateForm.setValue({
      ...this.validateForm.value,
      targetId: event['data'].payload.id
    });
  };

  // 复制ID
  handleCopyIdClick(event: Event): void {
    if (this.chatroomState?.id) {
      copy(this.chatroomState.id);
      this.message.info('Copy the id to clipboard.');
    }
  }
}
