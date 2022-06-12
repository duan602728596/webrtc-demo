import type { Store } from '@ngrx/store';
import { setChatRecord, type InitialState } from './chatroom.reducer';
import { ImageCache, type WebRTC, type MessageAction } from '../../utils/WebRTC';

/* 接收消息后的回调函数处理 */
export function dataChannelMessageCallback(
  store: Store<{ chatroom: InitialState }>,
  rtc: WebRTC,
  msgAction: MessageAction
): void {
  if (!(typeof msgAction === 'object' && 'type' in msgAction)) return;

  if (msgAction.type === 'message') {
    store.dispatch(setChatRecord({
      data: msgAction
    }));

    return;
  }

  if (msgAction.type === 'image-info') {
    rtc.imgCache = new ImageCache(msgAction.payload);

    return;
  }

  if (msgAction.type === 'arraybuffer' && rtc.imgCache) {
    rtc.imgCache.arrayBuffer.push(msgAction.payload);

    const arrayBufferSize: number = rtc.imgCache.arrayBufferSize;

    console.log(`Receive image: ${ Math.floor(arrayBufferSize / rtc.imgCache.size * 100) }%`);

    // 图片接收完毕
    if (arrayBufferSize >= rtc.imgCache.size) {
      const arraybuffer: ArrayBuffer = ImageCache.arrayBufferConcat(rtc.imgCache.arrayBuffer);
      const imgSrc: Blob = new Blob([arraybuffer], { type: rtc.imgCache.type });

      store.dispatch(setChatRecord({
        data: {
          type: 'image',
          payload: {
            date: rtc.imgCache.date,
            url: URL.createObjectURL(imgSrc),
            id: rtc.imgCache.id
          }
        }
      }));
      rtc.imgCache = null;
    }

    return;
  }
}