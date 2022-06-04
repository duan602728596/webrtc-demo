/**
 * 返回一个websocket的实例
 */
function websocketInstance() {
  const { protocol, host } = location;
  const isHttps = protocol === 'https:';
  const ws = new WebSocket(`ws${ isHttps ? 's' : '' }://${ host }/ws/rtc`);

  ws.sendJson = function(data) {
    ws.send(JSON.stringify(data));
  };

  return ws;
}

export default websocketInstance;