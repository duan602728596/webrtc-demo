import { channel } from './pusher';

export interface OnDataChannelMessage {
  (rtc: WebRTC, action: MessageAction);
}

export interface OnDisconnected {
  (rtc: WebRTC, event: Event);
}

interface Config {
  id: string;
  targetId: string;
  token: string;
  onDataChannelMessage?: OnDataChannelMessage;
  onDisconnected?: OnDisconnected;
  onOpen?: Function;
}

export interface SetPusherPayload {
  id: string;
  targetId: string;
  token: string;
  [key: string]: any;
}

export interface SetPusherAction {
  type: string;
  payload: SetPusherPayload;
}

export interface TextMessageAction {
  type: 'message';
  payload: {
    date: string;
    text: string;
    id: string;
  };
}

export interface ImageInfoPayload {
  id: string;
  name: string;
  size: number;
  type: string;
  date: string;
}

export interface ImageInfoAction {
  type: 'image-info';
  payload: ImageInfoPayload;
}

export interface ImageAction {
  type: 'arraybuffer';
  payload: ArrayBuffer;
}

export type MessageAction = TextMessageAction | ImageInfoAction | ImageAction | ArrayBuffer;

/* ImageCache */
export class ImageCache {
  /**
   * 合并ArrayBuffer
   * @param { Array<ArrayBuffer> } arrayBuffer
   */
  static arrayBufferConcat(arrayBuffer: Array<ArrayBuffer> = []): ArrayBuffer {
    let size: number = 0;

    arrayBuffer.forEach((o: ArrayBuffer): number => size += o.byteLength);

    const tmp: Uint8Array = new Uint8Array(size);

    for (let i: number = 0, end: number = 0; i < arrayBuffer.length; i++) {
      tmp.set(new Uint8Array(arrayBuffer[i]), end);
      end += arrayBuffer[i]?.byteLength;
    }

    return tmp.buffer;
  }

  id: string;
  name: string;
  size: number;
  type: string;
  date: string;
  arrayBuffer: Array<ArrayBuffer>;

  constructor(info: ImageInfoPayload) {
    this.id = info.id;
    this.name = info.name;
    this.size = info.size;
    this.type = info.type;
    this.date = info.date;
    this.arrayBuffer = [];
  }

  get arrayBufferSize(): number {
    let size: number = 0;

    this.arrayBuffer.forEach((o: ArrayBuffer) => size += o.byteLength);

    return size;
  }
}

/* WebRTC */
const search: URLSearchParams = new URLSearchParams(location.search);

export class WebRTC {
  // Send pusher message
  static async setPusher(data: SetPusherAction): Promise<void> {
    await fetch('/api/pusher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  id: string;
  targetId: string;
  token: string;
  rtc: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  onDataChannelMessage?: OnDataChannelMessage;
  onDisconnected?: OnDisconnected;
  onOpen?: Function;
  imgCache: ImageCache | null = null;
  useHost: boolean = search.has('host');

  constructor(config: Config) {
    const {
      id,
      targetId,
      token,
      onDataChannelMessage,
      onDisconnected,
      onOpen
    }: Config = config;

    this.id = id;
    this.targetId = targetId;
    this.token = token;
    this.onDataChannelMessage = onDataChannelMessage; // 接收消息的回调函数
    this.onDisconnected = onDisconnected; // 信道关闭
    this.onOpen = onOpen;
    this.rtc = new RTCPeerConnection(this.useHost ? undefined : {
      iceServers: [
        {
          urls: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
        },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    });

    // pusher
    channel.bind('rtc-confirm', this.handlePusherRTCConfirm);
    channel.bind('rtc-candidate', this.handlePusherRTCCandidate);

    // data channel
    this.dataChannel = this.rtc.createDataChannel(`sendChannel-${ this.id }`);
    this.dataChannel.addEventListener('open', this.handleDataChannelOpen);

    // 监听RTC的消息
    this.rtc.addEventListener('connectionstatechange', this.handleRTCConnectionstatechange);
    this.rtc.addEventListener('icecandidate', this.handleRTCIcecandidate);
    this.rtc.addEventListener('datachannel', this.handleRTCDataChannel);
  }

  createPayload(object: { [key: string]: any } = {}): SetPusherPayload {
    return {
      id: this.id,
      targetId: this.targetId,
      token: this.token,
      ...object
    };
  }

  // RTC状态的变化
  handleRTCConnectionstatechange: (event: Event) => void = (event: Event): void => {
    console.log(`connection state: ${ this.rtc.connectionState }`);

    if (this.rtc.connectionState === 'disconnected' || this.rtc.connectionState === 'failed') {
      this.destroy();

      /* eslint-disable @typescript-eslint/no-use-before-define */
      const index: number | undefined = webrtcGroup.findIndex((o: WebRTC): boolean => o.token === this.token);

      webrtcGroup.splice(index, 1);
      /* eslint-enable @typescript-eslint/no-use-before-define */
      this.onDisconnected?.(this, event);
    }
  };

  // 打开时发送消息
  handleDataChannelOpen: (event: Event) => void = (event: Event): void => {
    console.log('允许发送消息');
    this.onOpen?.(this);
  };

  // 信道连接
  handleRTCIcecandidate: (event: RTCPeerConnectionIceEvent) => Promise<void>
    = async (event: RTCPeerConnectionIceEvent): Promise<void> => {

      if (event.candidate && (this.useHost || event.candidate.type !== 'host')) {
        console.log('ICE层发送相关数据', event.candidate);
        await WebRTC.setPusher({
          type: 'rtc-candidate',
          payload: this.createPayload({
            candidate: event.candidate
          })
        });
      }
    };

  // RTC datachannel
  handleRTCDataChannel: (event: RTCDataChannelEventInit) => void = (event: RTCDataChannelEventInit): void => {
    if (event.channel.label === `sendChannel-${ this.targetId }`) {
      event.channel.addEventListener('open', () => console.log('允许接收消息'));
      event.channel.addEventListener('message', this.handleDataChannelMessage);
    }
  };

  // 通道接收消息
  handleDataChannelMessage: (event: MessageEvent) => void = (event: MessageEvent): void => {
    const action: MessageAction = typeof event.data === 'string' ? JSON.parse(event.data) : {
      type: 'arraybuffer',
      payload: event.data
    };

    this.onDataChannelMessage?.(this, action);
  };

  // pusher rtc-confirm
  handlePusherRTCConfirm: Function = async (action: SetPusherAction): Promise<void> => {
    if (action.payload.token !== this.token) return;

    await this.answer(action.payload.sdp);
  };

  // pusher rtc-candidate
  handlePusherRTCCandidate: Function = async (action: SetPusherAction): Promise<void> => {
    if (action.payload.token !== this.token) return;

    await this.rtc.addIceCandidate(action.payload.candidate);
  };


  // 请求端
  async askOffer(): Promise<void> {
    await this.rtc.setLocalDescription(await this.rtc.createOffer());
  }

  /**
   * 接收端
   * @param { RTCSessionDescriptionInit } sdp: 请求端的offer
   */
  async accept(sdp: RTCSessionDescriptionInit): Promise<void> {
    await this.rtc.setRemoteDescription(sdp);
    await this.rtc.setLocalDescription(await this.rtc.createAnswer());
  }

  /**
   * 请求端
   * @param { RTCSessionDescriptionInit } sdp: 接收端的answer
   */
  async answer(sdp: RTCSessionDescriptionInit): Promise<void> {
    await this.rtc.setRemoteDescription(sdp);
  }

  // 初始化
  async init(): Promise<void> {
    await this.askOffer();
    await WebRTC.setPusher({
      type: 'rtc-ask',
      payload: this.createPayload({
        sdp: this.rtc.localDescription
      })
    });
  }

  // 响应
  async confirm(sdp: RTCSessionDescriptionInit): Promise<void> {
    await this.accept(sdp);
    await WebRTC.setPusher({
      type: 'rtc-confirm',
      payload: this.createPayload({
        sdp: this.rtc.localDescription
      })
    });
  }

  // 销毁
  destroy(): void {
    channel.unbind('rtc-confirm', this.handlePusherRTCConfirm);
    channel.unbind('rtc-candidate', this.handlePusherRTCCandidate);
    this.rtc.close();
  }

  /**
   * 发送消息
   * @param { TextMessageAction | ImageInfoAction } data
   */
  sendMessage(data: TextMessageAction | ImageInfoAction): void {
    this.dataChannel.send(JSON.stringify(data));
  }

  /**
   * 发送ArrayBuffer
   * @param { ArrayBuffer } data
   */
  sendBuffer(data: ArrayBuffer): void {
    this.dataChannel.send(data);
  }
}

export const webrtcGroup: Array<WebRTC> = [];