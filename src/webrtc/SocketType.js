/* websocket的类型 */
class SOCKET_TYPE {
  static INIT = 'init';                   // 初始化server端socket的连接
  static ALL_IDS = 'all-ids';             // 获取server端所有的ids
  static RTC_ASK= 'rtc-ask';              // RTC请求端发送申请连接
  static RTC_CONFIRM = 'RTC-confirm';     // 接收端发送确认消息
  static RTC_CANDIDATE = 'RTC-candidate'; // 发送candidate

  // 视频相关的通信
  static VIDEO_INIT = 'video-init';                 // 初始化server端socket的连接
  static VIDEO_ALL_IDS = 'video-all-ids';           // 获取server端所有的ids
  static VIDEO_STOP_SHARING = 'video-stop-sharing'; // 停止共享
}

export default SOCKET_TYPE;