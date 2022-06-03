import randomString from './utils/randomString.js';
import SOCKET_TYPE from './webrtc/SocketType.js';
import WebRTC from './webrtc/WebRTC.js';

const connectIds = document.getElementById('connect-ids');
const sendMessageTextarea = document.getElementById('send-message-textarea');
const sendMessageBtn = document.getElementById('send-message-btn');
const myIdView = document.getElementById('my-id-view');
const targetIdView = document.getElementById('target-id-view');
const allMessage = document.getElementById('all-message');
const bsOfflineHinAlert = document.getElementById('offline-hint-alert');

/* 当前用户的id */
const id = randomString();

myIdView.innerText = id;
document.title = `${ document.title } ( ${ id } )`;

/* 所有的RTC */
const RTCMap = new Map();
let RTCTarget = null;

/* websocket连接 */
const isHttps = location.protocol === 'https:';
const ws = new WebSocket(`ws${ isHttps ? 's' : '' }://${ location.host }/ws/rtc`);

ws.sendJson = function(data) {
  ws.send(JSON.stringify(data));
};

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
        .map((o) => `<button class="me-2 btn btn-info" data-id="${ o }">${ o }</button>`)
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

/* 监听按钮点击事件 */
async function handleConnectIdsBtnClick(event) {
  event.stopPropagation();
  event.preventDefault();
  const { target } = event;

  if (target.tagName.toLocaleLowerCase() === 'button') {
    const acceptId = target.dataset.id;

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

/* 点击消息内的下划线监听 */
async function handleAllMessageLinkClick(event) {
  event.stopPropagation();
  event.preventDefault();
  const { target } = event;

  if (target.tagName.toLocaleLowerCase() === 'a') {
    const acceptId = target.dataset.id;

    if (RTCMap.has(id)) {
      RTCTarget = RTCMap.get(acceptId);
      targetIdView.innerText = RTCTarget.targetId;
      sendMessageBtn.disabled = false;
    } else if (!document.getElementById('offline-hint-alert-clone')) {
      // 对方下线提示
      const bsAlert = bsOfflineHinAlert.cloneNode(true);

      bsAlert.classList.remove('d-none');
      bsAlert.id = 'offline-hint-alert-clone';
      document.body.appendChild(bsAlert);
      new bootstrap.Alert(bsAlert);
    }
  }
}

allMessage.addEventListener('click', handleAllMessageLinkClick);

/* 发送消息 */
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