const KEY: string = '1234567890_qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
const KEY_LENGTH: number = KEY.length;

export function randomString(length: number = 10): string {
  let result: string = '';

  for (let i: number = 0; i < length; i++) {
    result += KEY[Math.floor(Math.random() * KEY_LENGTH)];
  }

  return result;
}