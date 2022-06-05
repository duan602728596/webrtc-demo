import SOCKET_TYPE from '../webrtc/SocketType.js';

class VideoRTC {
  constructor(config) {
    const {
      id,
      targetId,
      token,
      ws,
      stream,
      onTrack,
      onStreamInactive,
      onDisconnected
    } = config;

    this.id = id;             // 我的id
    this.targetId = targetId; // 另一端的id
    this.token = token;       // 两端唯一的token
    this.ws = ws;             // websocket
    this.rtc = new RTCPeerConnection();
    this.stream = stream;
    this.onTrack = onTrack;
    this.onStreamInactive = onStreamInactive;
    this.onDisconnected = onDisconnected;

    // websocket
    this.ws.addEventListener('message', this.handleWebsocketMessage);

    // add track
    if (this.stream) {
      this.stream.getTracks().forEach(track => this.rtc.addTrack(track, stream));
      this.stream.addEventListener('inactive', this.handleStreamInactive);
    }

    // 监听RTC的消息
    this.rtc.addEventListener('connectionstatechange', this.handleRTCConnectionstatechange);
    this.rtc.addEventListener('icecandidate', this.handleRTCIcecandidate);
    this.rtc.addEventListener('track', this.handleRTCTrack);
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

  // track事件
  handleRTCTrack = (event) => {
    this.stream = event.streams[0];
    this.onTrack?.(this, event);
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

  // 停止连接（请求端）
  handleStreamInactive = (event) => {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    this.onStreamInactive?.(this, event);
    this.ws.sendJson({
      type: SOCKET_TYPE.VIDEO_STOP_SHARING,
      payload: this.createPayload()
    });
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
}

export default VideoRTC;