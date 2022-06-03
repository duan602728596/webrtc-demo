class WsConnect {
  constructor(id, ws, type) {
    this.id = id;     // id
    this.ws = ws;     // ws连接
    this.type = type; // message or stream
  }

  sendJson(data) {
    this.ws.send(JSON.stringify(data));
  }
}

export default WsConnect;