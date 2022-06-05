import SOCKET_TYPE from '../webrtc/SocketType.js';

class WebRTC {
  constructor(config) {
    const {
      id,
      targetId,
      token,
      ws,
      onDataChannelMessage,
      onDisconnected
    } = config;

    this.id = id;             // 我的id
    this.targetId = targetId; // 另一端的id
    this.token = token;       // 两端唯一的token
    this.ws = ws;             // websocket
    this.onDataChannelMessage = onDataChannelMessage; // 接收消息的回调函数
    this.onDisconnected = onDisconnected; // 信道关闭
    this.rtc = new RTCPeerConnection();   // rtc，https://gist.github.com/yetithefoot/7592580

    // websocket
    this.ws.addEventListener('message', this.handleWebsocketMessage);

    // 创建消息通道
    this.dataChannel = this.rtc.createDataChannel(`sendChannel-${ this.id }`);
    this.dataChannel.addEventListener('open', (event) => console.log('允许发送消息'));

    // 监听RTC的消息
    this.rtc.addEventListener('connectionstatechange', this.handleRTCConnectionstatechange);
    this.rtc.addEventListener('icecandidate', this.handleRTCIcecandidate);
    this.rtc.addEventListener('datachannel', this.handleRTCDataChannel);
  }

  createPayload(object = {}) {
    return {
      id: this.id,
      targetId: this.targetId,
      token: this.token,
      ...object
    };
  }

  // RTC状态的变化
  handleRTCConnectionstatechange = (event) => {
    console.log(`connection state: ${ this.rtc.connectionState }`)

    if (this.rtc.connectionState === 'disconnected') {
      this.onDisconnected?.(this, event);
    }
  };

  // 信道连接
  handleRTCIcecandidate = async (event) => {
    if (event.candidate) {
      console.log('ICE层发送相关数据');
      this.ws.sendJson({
        type: SOCKET_TYPE.RTC_CANDIDATE,
        payload: this.createPayload({
          candidate: event.candidate
        })
      });
    }
  };

  // RTC datachannel
  handleRTCDataChannel = (event) => {
    if (event.channel.label === `sendChannel-${ this.targetId }`) {
      event.channel.addEventListener('open', () => console.log('允许接收消息'));
      event.channel.addEventListener('message', this.handleDataChannelMessage);
    }
  };

  // 通道接收消息
  handleDataChannelMessage = (event) => {
    const action = JSON.parse(event.data);

    this.onDataChannelMessage(this, action);
  };

  // 请求端
  async askOffer() {
    await this.rtc.setLocalDescription(await this.rtc.createOffer());
  }

  /**
   * 接收端
   * @param { RTCSessionDescriptionInit } sdp: 请求端的offer
   */
  async accept(sdp) {
    await this.rtc.setRemoteDescription(sdp);
    await this.rtc.setLocalDescription(await this.rtc.createAnswer());
  }

  /**
   * 请求端
   * @param { RTCSessionDescriptionInit } sdp: 接收端的answer
   */
  async answer(sdp) {
    await this.rtc.setRemoteDescription(sdp);
  }

  // websocket监听
  handleWebsocketMessage = async (event) => {
    const action = JSON.parse(event.data);

    if (action.payload.token !== this.token) return;

    switch (action.type) {
      case SOCKET_TYPE.RTC_CONFIRM:
        await this.answer(action.payload.sdp);
        break;

      case SOCKET_TYPE.RTC_CANDIDATE:
        console.log('ICE层接收并添加相关数据');
        await this.rtc.addIceCandidate(action.payload.candidate);
        break;
    }
  };

  // 初始化
  async init() {
    await this.askOffer();
    this.ws.sendJson({
      type: SOCKET_TYPE.RTC_ASK,
      payload: this.createPayload({
        sdp: this.rtc.localDescription
      })
    });
  }

  // 响应
  async confirm(sdp) {
    await this.accept(sdp);
    this.ws.sendJson({
      type: SOCKET_TYPE.RTC_CONFIRM,
      payload: this.createPayload({
        sdp: this.rtc.localDescription
      })
    });
  }

  // 销毁
  destroy() {
    this.ws.removeEventListener('message', this.handleWebsocketMessage);
    this.rtc.close();
  }

  // 发送消息
  sendMessage(data) {
    this.dataChannel.send(JSON.stringify(data));
  }
}

export default WebRTC;