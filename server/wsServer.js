import { WebSocketServer } from 'ws';
import { Queue } from '@bbkkbkk/q';
import SOCKET_TYPE from '../src/webrtc/SocketType.js';
import WsConnect from './WsConnect.js';

/* websocket */
const wsConnectMap = new Map();
const queue = new Queue({ workerLen: 1 });

/**
 * 发送所有的id
 * @param { string | undefined } closeId: 如果是被关闭，则发送closeId
 */
function sendAllIds(closeId) {
  const ids = [];

  wsConnectMap.forEach((connect, id) => {
    if (connect.type === 'message') {
      ids.push(id);
    }
  });

  ids.forEach((id) => {
    const connect = wsConnectMap.get(id);

    connect && connect.sendJson({
      type: SOCKET_TYPE.ALL_IDS,
      payload: {
        ids,
        closeId
      }
    })
  });
}

/* 初始化 */
function wsInit(action, ws) {
  const connect = new WsConnect(action.payload, ws, 'message');

  ws._connectId = action.payload;
  wsConnectMap.set(action.payload, connect);
  queue.use([sendAllIds]);
  queue.run();
}

function handleWebSocketServerConnection(ws) {
  ws.on('message', function(data) {
    const action = JSON.parse(data);

    // 初始化
    if (action.type === SOCKET_TYPE.INIT) {
      wsInit(action, ws);
    }

    if ([SOCKET_TYPE.RTC_ASK, SOCKET_TYPE.RTC_CONFIRM, SOCKET_TYPE.RTC_CANDIDATE].includes(action.type)) {
      const item = wsConnectMap.get(action.payload.targetId);

      item?.sendJson(action);
    }
  });

  ws.on('close', function() {
    const connect = wsConnectMap.get(ws._connectId);

    wsConnectMap.delete(connect.id, connect);
    queue.use([sendAllIds, undefined, connect.id]);
    queue.run();
  });
}

/* 创建websocket server */
function wsServer(server) {
  const webSocketServer = new WebSocketServer({
    server,
    path: '/ws/rtc'
  });

  webSocketServer.on('connection', handleWebSocketServerConnection);
}

export default wsServer;