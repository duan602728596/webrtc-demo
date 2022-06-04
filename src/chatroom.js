import WebRTC from './webrtc/WebRTC.js';
import SOCKET_TYPE from './webrtc/SocketType.js';
import randomString from './utils/randomString.js';
import getUserId from './utils/getUserId.js';
import websocketInstance from './utils/websocketInstance.js';
import bsAlert from './utils/bsAlert.js';

const connectIds = document.getElementById('connect-ids');
const sendMessageBtn = document.getElementById('send-message-btn');
const targetIdView = document.getElementById('target-id-view');
const allMessage = document.getElementById('all-message');

/* ========== 生成当前用户的id ========== */
const id = getUserId('my-id-view');

/* ========== RTC ========== */
const RTCMap = new Map(); // 当前所有的webrtc连接
let RTCTarget = null;     // 发送的webrtc

/* ========== websocket连接 ========== */
const ws = websocketInstance();

/* 初始化 */
function handleWebsocketOpen(event) {
  ws.sendJson({
    type: SOCKET_TYPE.INIT,
    payload: id
  });
}

ws.addEventListener('open', handleWebsocketOpen);

/* 通道监听消息 */
async function handleRTCDataChannelMessage(webrtc, action) {
  const li = document.createElement('li');

  li.classList.add('text-success');
  li.innerHTML = `[<time class="fw-bold text-12px">${ action.payload.date }</time>&nbsp;接收]&nbsp;
<a class="link-success" href="#" data-id="${ webrtc.targetId }">
  ${ webrtc.targetId }
</a>：${ action.payload.text }`;
  allMessage.appendChild(li);
}

/* 监听所有消息 */
async function handleWebsocketMessage(event) {
  const action = JSON.parse(event.data);

  switch (action.type) {
    // 获取id并添加按钮
    case SOCKET_TYPE.ALL_IDS:
      connectIds.innerHTML = action.payload.ids
        .filter((o) => o !== id)
        .map((o) => `<button class="me-2 btn btn-info" type="button" data-id="${ o }">${ o }</button>`)
        .join('');

      // 移除连接
      if (action.payload.closeId && RTCMap.has(action.payload.closeId)) {
        const webrtc = RTCMap.get(action.payload.closeId);

        webrtc.destroy();
        RTCMap.delete(action.payload.closeId);

        if (RTCTarget?.targetId === action.payload.closeId) {
          targetIdView.innerText = '';
          sendMessageBtn.disabled = true;
        }
      }

      break;

    // 收到消息，创建连接
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

/* ========== 根据当前在线的人，切换RTCTarget，监听按钮点击事件 ========== */
async function handleConnectIdsBtnClick(event) {
  event.stopPropagation();
  event.preventDefault();

  if (event.target.tagName.toLocaleLowerCase() === 'button') {
    const acceptId = event.target.dataset.id;

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
    sendMessageBtn.disabled = false;
  }
}

connectIds.addEventListener('click', handleConnectIdsBtnClick);

/* ========== 点击消息内的下划线，切换RTCTarget ========== */
async function handleAllMessageLinkClick(event) {
  event.stopPropagation();
  event.preventDefault();

  if (event.target.tagName.toLocaleLowerCase() === 'a') {
    const acceptId = event.target.dataset.id;

    if (RTCMap.has(acceptId)) {
      RTCTarget = RTCMap.get(acceptId);
      targetIdView.innerText = RTCTarget.targetId;
      sendMessageBtn.disabled = false;
    } else {
      bsAlert(); // 对方下线提示
    }
  }
}

allMessage.addEventListener('click', handleAllMessageLinkClick);

/* ========== 发送聊天消息 ========== */
const sendMessageTextarea = document.getElementById('send-message-textarea');

function handleSendMessage(event) {
  const value = sendMessageTextarea.value;

  if (RTCTarget && value) {
    const date = dayjs().format('YYYY-MM-DD HH:mm:ss');

    RTCTarget.sendMessage({
      type: 'text',
      payload: {
        text: value,
        date
      }
    });

    const li = document.createElement('li');

    li.classList.add('text-primary');
    li.innerHTML = `[<time class="fw-bold text-12px">${ date }</time>&nbsp;发送]&nbsp;
<a class="link-primary" href="#" data-id="${ RTCTarget.targetId }">
  ${ RTCTarget.targetId }
</a>：${ value }`;
    allMessage.appendChild(li);
    sendMessageTextarea.value = '';
  }
}

sendMessageBtn.addEventListener('click', handleSendMessage);