import process from 'node:process';
import path from 'node:path';
import http from 'node:http';
import http2 from 'node:http2';
import Koa from 'koa';
import serve from 'koa-static';
import wsServer from './wsServer.js';
import * as httpsConfig from './httpsConfig.js';

const cwd = process.cwd();
const app = new Koa();

/* 静态资源 */
app.use(serve(path.join(cwd, 'src'), {
  maxage: 0
}));

const server = httpsConfig.useHttps ? http2.createSecureServer({
  allowHTTP1: true,
  key: httpsConfig.key,
  cert: httpsConfig.cert
}, app.callback()) : http.createServer(app.callback());

wsServer(server);
server.listen(5050);