const key = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_';
const keyLength = key.length;

/**
 * 随机字符串
 * @param { number } length: 长度
 */
function randomString(length = 10) {
  let result = '';

  for (let i = 0; i < length; i++) {
    result += key[Math.floor(Math.random() * keyLength)];
  }

  return result;
}

export default randomString;