import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';
import fsP from 'node:fs/promises';

/* 获取https的文件和配置 */
const cwd = process.cwd();
const keyPath = path.join(cwd, 'dev.key');
const certPath = path.join(cwd, 'dev.crt');

export const [key, cert] = await Promise.all([
  fs.existsSync(keyPath) ? fsP.readFile(keyPath) : null,
  fs.existsSync(certPath) ? fsP.readFile(certPath) : null
]);

export const useHttps = key && cert;