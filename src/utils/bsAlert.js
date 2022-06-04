const bsOfflineHinAlert = document.getElementById('offline-hint-alert');

/**
 * 创建一个弹出框
 */
function bsAlert() {
  if (!document.getElementById('offline-hint-alert-clone')) {
    const bsAlert = bsOfflineHinAlert.cloneNode(true);

    bsAlert.classList.remove('d-none');
    bsAlert.id = 'offline-hint-alert-clone';
    document.body.appendChild(bsAlert);
    new bootstrap.Alert(bsAlert);
  }
}

export default bsAlert;