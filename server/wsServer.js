import { WebSocketServer } from 'ws';
import { Queue } from '@bbkkbkk/q';
import SOCKET_TYPE from '../src/webrtc/SocketType.js';
import WsConnect from './WsConnect.js';

/* websocket */
const wsConnectMap = new Map();
const queue = new Queue({ workerLen: 1 });

/**
 * 发送所有的id
 * @param { 'message' | 'stream' } type: 连接类型，message：传递文本消息，stream：传递视频
 * @param { string | undefined } closeId: 如果是被关闭，则发送closeId
 */
function socketBroadcastAllIds(type, closeId) {
  const ids = [];

  wsConnectMap.forEach((connect, id) => (connect.type === type && ids.push(id)));

  ids.forEach((id) => {
    const connect = wsConnectMap.get(id);

    connect && connect.sendJson({
      type: type === 'stream' ? SOCKET_TYPE.VIDEO_ALL_IDS : SOCKET_TYPE.ALL_IDS,
      payload: { ids, closeId }
    })
  });
}

/**
 * websocket的连接事件
 * @param { import('ws').WebSocket } ws: socket
 */
function handleWebSocketServerConnection(ws) {
  ws.on('message', function(data) {
    const action = JSON.parse(data);

    // 初始化，并将消息广播
    if (action.type === SOCKET_TYPE.INIT || action.type === SOCKET_TYPE.VIDEO_INIT) {
      const type = action.type === SOCKET_TYPE.VIDEO_INIT ? 'stream' : 'message';
      const connect = new WsConnect(action.payload, ws, type);

      ws._connectId = action.payload;
      wsConnectMap.set(action.payload, connect);
      queue.use([socketBroadcastAllIds, undefined, type]);
      queue.run();
    }

    // 将消息发送给指定的ws连接
    if ([
      SOCKET_TYPE.RTC_ASK,
      SOCKET_TYPE.RTC_CONFIRM,
      SOCKET_TYPE.RTC_CANDIDATE,
      SOCKET_TYPE.VIDEO_STOP_SHARING
    ].includes(action.type)) {
      const item = wsConnectMap.get(action.payload.targetId);

      item?.sendJson(action);
    }
  });

  ws.on('close', function() {
    const connect = wsConnectMap.get(ws._connectId);

    wsConnectMap.delete(connect.id, connect);
    queue.use([socketBroadcastAllIds, undefined, connect.type, connect.id]);
    queue.run();
  });
}

/**
 * 创建websocket server
 * @param {
 *   import('node:http').Server
 *   | import('node:https').Server
 *   | import('node:http2').Http2SecureServer
 * } server: 创建webSocket的Server
 */
function wsServer(server) {
  const webSocketServer = new WebSocketServer({
    server,
    path: '/ws/rtc'
  });

  webSocketServer.on('connection', handleWebSocketServerConnection);
}

export default wsServer;