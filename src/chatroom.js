import randomString from './utils/randomString.js';
import SOCKET_TYPE from './webrtc/SocketType.js';
import WebRTC from './webrtc/WebRTC.js';

const connectIds = document.getElementById('connect-ids');
const sendMessageTextarea = document.getElementById('send-message-textarea');
const sendMessageBtn = document.getElementById('send-message-btn');
const myIdView = document.getElementById('my-id-view');
const targetIdView = document.getElementById('target-id-view');
const allMessage = document.getElementById('all-message');

// 当前用户的id
const id = randomString();

myIdView.innerText = id;
document.title = `${ document.title } ( ${ id } )`;

// 所有的RTC
const RTCMap = new Map();
let RTCTarget = null;

// websocket连接
const isHttps = location.protocol === 'https:';
const ws = new WebSocket(`ws${ isHttps ? 's' : '' }://${ location.host }/ws/rtc`);

ws.sendJson = function(data) {
  ws.send(JSON.stringify(data));
};

// 初始化
function handleWebsocketOpen(event) {
  ws.sendJson({
    type: SOCKET_TYPE.INIT,
    payload: id
  });
}

ws.addEventListener('open', handleWebsocketOpen);

// 通道监听消息
async function handleRTCDataChannelMessage(webrtc, action) {
  const li = document.createElement('li');

  li.classList.add('text-success');
  li.innerHTML = `[接收]&nbsp;
<a class="link-success" href="#" data-id="${ webrtc.targetId }">
  ${ webrtc.targetId }
</a>：${ action.payload }`;
  allMessage.appendChild(li);
}

// 监听所有消息
async function handleWebsocketMessage(event) {
  const action = JSON.parse(event.data);

  switch (action.type) {
    // 获取id并添加按钮
    case SOCKET_TYPE.ALL_IDS:
      connectIds.innerHTML = action.payload.ids
        .filter((o) => o !== id)
        .map((o) => `<button class="me-2 btn btn-info" data-id="${ o }">${ o }</button>`)
        .join('');

      // 移除连接
      if (action.payload.closeId && RTCMap.has(action.payload.closeId)) {
        const webrtc = RTCMap.get(action.payload.closeId);

        webrtc.destroy();
        RTCMap.delete(action.payload.closeId);

        if (RTCTarget?.targetId === action.payload.closeId) {
          targetIdView.innerText = '';
        }
      }

      break;

    case SOCKET_TYPE.RTC_ASK:
      const webrtc = new WebRTC({
        id,
        targetId: action.payload.id,
        token: action.payload.token,
        ws,
        onDataChannelMessage: handleRTCDataChannelMessage
      });

      await webrtc.confirm(action.payload.sdp);
      RTCMap.set(action.payload.id, webrtc);
      break;
  }
}

ws.addEventListener('message', handleWebsocketMessage);

// 创建webRTC
async function createWebRTC(acceptId) {
  if (!RTCMap.has(acceptId)) {
    const token = randomString(30);
    const webrtc = new WebRTC({
      id,
      targetId: acceptId,
      token,
      ws,
      onDataChannelMessage: handleRTCDataChannelMessage
    });

    await webrtc.init();
    RTCMap.set(acceptId, webrtc);
  }

  RTCTarget = RTCMap.get(acceptId);
  targetIdView.innerText = RTCTarget.targetId;
}

// 监听按钮点击事件
async function handleConnectIdsBtnClick(event) {
  event.stopPropagation();
  event.preventDefault();
  const { target } = event;

  if (target.tagName.toLocaleLowerCase() === 'button') {
    await createWebRTC(target.dataset.id);
  }
}

connectIds.addEventListener('click', handleConnectIdsBtnClick);

// 点击消息内的下划线监听
async function handleAllMessageLinkClick(event) {
  event.stopPropagation();
  event.preventDefault();
  const { target } = event;

  if (target.tagName.toLocaleLowerCase() === 'a') {
    await createWebRTC(target.dataset.id);
  }
}

allMessage.addEventListener('click', handleAllMessageLinkClick);

// 发送消息
function handleSendMessage(event) {
  const value = sendMessageTextarea.value;

  if (RTCTarget && value) {
    RTCTarget.sendMessage({
      type: 'text',
      payload: value
    });

    const li = document.createElement('li');

    li.classList.add('text-primary');
    li.innerHTML = `[发送]&nbsp;
<a class="link-primary" href="#" data-id="${ RTCTarget.targetId }">
  ${ RTCTarget.targetId }
</a>：${ value }`;
    allMessage.appendChild(li);
    sendMessageTextarea.value = '';
  }
}

sendMessageBtn.addEventListener('click', handleSendMessage);