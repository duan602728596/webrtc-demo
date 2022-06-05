const bsOfflineHinAlert = document.getElementById('offline-hint-alert');

/**
 * 创建一个弹出框
 * @param { string } text: 插入的文本
 */
function bsAlert(text) {
  if (!document.getElementById('offline-hint-alert-clone')) {
    const bsAlert = bsOfflineHinAlert.cloneNode(true);

    bsAlert.classList.remove('d-none');
    bsAlert.id = 'offline-hint-alert-clone';
    bsAlert.querySelector('[data-role="alert-content"]').innerText = text;
    document.body.appendChild(bsAlert);
    new bootstrap.Alert(bsAlert);
  }
}

export default bsAlert;