class WsConnect {
  /**
   * @param { string } id: 当前连接对应的id
   * @param { import('ws').WebSocket } ws: ws连接
   * @param { 'message' | 'stream' } type: 连接类型，message：传递文本消息，stream：传递视频
   */
  constructor(id, ws, type) {
    this.id = id;
    this.ws = ws;
    this.type = type;
  }

  sendJson(data) {
    this.ws.send(JSON.stringify(data));
  }
}

export default WsConnect;