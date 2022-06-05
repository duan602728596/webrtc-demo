import WebRTC from './webrtc/WebRTC.js';
import SOCKET_TYPE from './webrtc/SocketType.js';
import ImageCache from './webrtc/ImageCache.js';
import randomString from './utils/randomString.js';
import getUserId from './utils/getUserId.js';
import websocketInstance from './utils/websocketInstance.js';
import bsAlert from './utils/bsAlert.js';

const connectIds = document.getElementById('connect-ids');
const sendMessageBtn = document.getElementById('send-message-btn');
const uploadFile = document.getElementById('upload-file');
const targetIdView = document.getElementById('target-id-view');
const allMessage = document.getElementById('all-message');

/* ========== 生成当前用户的id ========== */
const id = getUserId('my-id-view');

/* ========== RTC ========== */
const RTCMap = new Map(); // 当前所有的webrtc连接
let RTCTarget = null;     // 发送的webrtc

/* ========== 移除RTC的连接 ========== */
function handleRemoveRTCDisconnected(rtc, event) {
  const webrtc = RTCMap.get(rtc.targetId);

  webrtc.destroy();
  RTCMap.delete(rtc.targetId);

  if (RTCTarget?.targetId === rtc.targetId) {
    targetIdView.innerText = '';
    sendMessageBtn.disabled = true;
    uploadFile.disabled = true;
  }
}

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
const queue = new Q.Queue({ workerLen: 1 }); // 使用队列保证图片ArrayBuffer的顺序

async function handleRTCDataChannelMessage(webrtc, action) {
  // 接收二进制消息
  if (action.type === 'arraybuffer') {
    queue.use([webrtc.imgCache.arrayBuffer.push, webrtc.imgCache.arrayBuffer, action.payload]);
    queue.run();

    const arrayBufferSize = webrtc.imgCache.arrayBufferSize;

    // 图片接收完毕
    if (arrayBufferSize >= webrtc.imgCache.size) {
      queue.use([() => {
        const arraybuffer = ImageCache.arrayBufferConcat(webrtc.imgCache.arrayBuffer);
        const li = document.createElement('li');

        li.classList.add('text-success');
        li.innerHTML = `[<time class="fw-bold text-12px">${ webrtc.imgCache.date }</time>&nbsp;接收]&nbsp;
<a class="link-success" href="#" data-id="${ webrtc.targetId }">${ webrtc.targetId }</a>
：<img class="upload-image">`;
        li.querySelector('img').src = URL.createObjectURL(
          new Blob([arraybuffer], { type: webrtc.imgCache.type }));
        allMessage.appendChild(li);
        webrtc.imgCache = null;
      }]);
      queue.run();
    }

    return;
  }

  // 图片信息
  if (action.type === 'image-info') {
    queue.use([() => webrtc.imgCache = new ImageCache(action.payload)]);
    queue.run();
  }

  // 文字消息
  if (action.type === 'text') {
    const li = document.createElement('li');

    li.classList.add('text-success');
    li.innerHTML = `[<time class="fw-bold text-12px">${ action.payload.date }</time>&nbsp;接收]&nbsp;
<a class="link-success" href="#" data-id="${ webrtc.targetId }">${ webrtc.targetId }</a>
：${ action.payload.text }`;
    allMessage.appendChild(li);
  }
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

      break;

    // 收到消息，创建连接
    case SOCKET_TYPE.RTC_ASK:
      const webrtc = new WebRTC({
        id,
        targetId: action.payload.id,
        token: action.payload.token,
        ws,
        onDataChannelMessage: handleRTCDataChannelMessage,
        onDisconnected: handleRemoveRTCDisconnected
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
        onDataChannelMessage: handleRTCDataChannelMessage,
        onDisconnected: handleRemoveRTCDisconnected
      });

      await webrtc.init();
      RTCMap.set(acceptId, webrtc);
    }

    RTCTarget = RTCMap.get(acceptId);
    targetIdView.innerText = RTCTarget.targetId;
    sendMessageBtn.disabled = false;
    uploadFile.disabled = false;
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
      uploadFile.disabled = false;
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
<a class="link-primary" href="#" data-id="${ RTCTarget.targetId }">${ RTCTarget.targetId }</a>
：${ value }`;
    allMessage.appendChild(li);
    sendMessageTextarea.value = '';
  }
}

sendMessageBtn.addEventListener('click', handleSendMessage);

/* ========== 发送图片 ========== */
function handleSendImageChange(event) {
  if (RTCTarget && event.target.files?.length) {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      const { name, size, type } = event.target.files[0];
      const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const id = randomString(30);
      const arraybuffer = reader.result;

      // 本地插入图片
      const li = document.createElement('li');

      li.classList.add('text-primary');
      li.innerHTML = `[<time class="fw-bold text-12px">${ date }</time>&nbsp;发送]&nbsp;
<a class="link-primary" href="#" data-id="${ RTCTarget.targetId }">${ RTCTarget.targetId }</a>
：<img class="upload-image">`;
      li.querySelector('img').src = URL.createObjectURL(new Blob([arraybuffer], { type }));
      allMessage.appendChild(li);

      // 发送图片信息
      RTCTarget.sendMessage({
        type: 'image-info',
        payload: { id, name, size, type, date }
      });

      // 分片发送
      const partialSize = 1_024 * 5; // 每片大小
      const partial = Math.ceil(size / partialSize); // 上传次数

      for (let i = 0; i < partial; i++) {
        const sliceArraybuffer = arraybuffer.slice(partialSize * i, i === partial - 1 ? size : partialSize * (i + 1));

        RTCTarget.sendBuffer(sliceArraybuffer);
      }
    });

    reader.readAsArrayBuffer(event.target.files[0]);
  }
}

uploadFile.addEventListener('change', handleSendImageChange);