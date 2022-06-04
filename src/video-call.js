import VideoRTC from './webrtc/VideoRTC.js';
import SOCKET_TYPE from './webrtc/SocketType.js';
import getUserId from './utils/getUserId.js';
import websocketInstance from './utils/websocketInstance.js';
import randomString from './utils/randomString.js';

const connectIds = document.getElementById('connect-ids');
const screenSharingVideo = document.getElementById('screen-sharing-video');
const screenSharingBtn = document.getElementById('screen-sharing-btn');
const cameraSharingBtn = document.getElementById('camera-sharing-btn');
const targetIdView = document.getElementById('target-id-view');

/* ========== 生成当前用户的id ========== */
const id = getUserId('my-id-view');

/* ========== RTC ========== */
const RTCMap = new Map();       // 当前所有的webrtc连接
let willContentTargetId = null; // 将要连接的id。注意，只有点击了分享后才能开启信道

/* ========== 屏幕分享 ========== */
/**
 * 开始共享
 * @param { MediaStream } stream: 视频流
 */
function videoPlay(stream) {
  screenSharingVideo.srcObject = stream;
  screenSharingVideo.play();
}

/**
 * 停止共享后删除连接
 * @param { string } closeId: 被关闭的ID
 */
function stopScreenSharing(closeId) {
  const webrtc = RTCMap.get(closeId);

  webrtc.destroy();
  RTCMap.delete(closeId);
  targetIdView.innerText = '';
  screenSharingBtn.disabled = false;
  cameraSharingBtn.disabled = false;
  screenSharingVideo.srcObject = null;
  willContentTargetId = null;
}

/* ========== websocket连接 ========== */
const ws = websocketInstance();

/* 初始化 */
function handleWebsocketOpen(event) {
  ws.sendJson({
    type: SOCKET_TYPE.VIDEO_INIT,
    payload: id
  });
}

ws.addEventListener('open', handleWebsocketOpen);

/* 监听所有消息 */
async function handleWebsocketMessage(event) {
  const action = JSON.parse(event.data);

  switch (action.type) {
    // 获取id并添加按钮
    case SOCKET_TYPE.VIDEO_ALL_IDS:
      connectIds.innerHTML = action.payload.ids
        .filter((o) => o !== id)
        .map((o) => `<button class="me-2 btn btn-info" type="button" data-id="${ o }">${ o }</button>`)
        .join('');

      // 移除连接
      if (action.payload.closeId && RTCMap.has(action.payload.closeId)) {
        stopScreenSharing(action.payload.closeId);
      }

      break;

    // 收到消息，创建连接
    case SOCKET_TYPE.RTC_ASK:
      const webrtc = new VideoRTC({
        id,
        targetId: action.payload.id,
        token: action.payload.token,
        ws,
        onTrack(rtc, event) {
          videoPlay(event.streams[0]);
        },
        onStreamInactive(rtc) {
          stopScreenSharing(rtc.targetId);
        }
      });

      await webrtc.confirm(action.payload.sdp);
      RTCMap.set(action.payload.id, webrtc);
      targetIdView.innerText = action.payload.id;
      break;

    // 停止分享
    case SOCKET_TYPE.VIDEO_STOP_SHARING:
      stopScreenSharing(action.payload.id);
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

    willContentTargetId = targetIdView.innerText = acceptId;
    screenSharingBtn.disabled = false;
    cameraSharingBtn.disabled = false;
  }
}

connectIds.addEventListener('click', handleConnectIdsBtnClick);

/* ========== 点击分享屏幕或者摄像头，初始化连接 ========== */
async function sharingCallback(stream, event) {
  if (!RTCMap.has(willContentTargetId)) {
    const token = randomString(30);
    const webrtc = new VideoRTC({
      id,
      targetId: willContentTargetId,
      token,
      ws,
      stream,
      onStreamInactive(rtc) {
        stopScreenSharing(rtc.targetId);
      }
    });

    await webrtc.init();
    RTCMap.set(willContentTargetId, webrtc);
    screenSharingBtn.disabled = true;
    videoPlay(stream);
  }
}

async function handleScreenSharingClick(event) {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: 'always' },
    audio: true
  });

  await sharingCallback(stream, event);
}

async function handleCameraSharingClick(event) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { cursor: 'always' },
    audio: true
  });

  await sharingCallback(stream, event);
}

screenSharingBtn.addEventListener('click', handleScreenSharingClick);
cameraSharingBtn.addEventListener('click', handleCameraSharingClick);