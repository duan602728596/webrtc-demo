import https from 'node:https';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { NextApiRequest, NextApiResponse } from 'next';

export interface XirsysIceServer {
  v: {
    iceServers: RTCIceServer;
  };
}

function getIceServer(): Promise<XirsysIceServer> {
  return new Promise((resolve: Function, reject: Function): void => {
    const req: ClientRequest = https.request({
      host: 'global.xirsys.net',
      path: '/_turn/a1',
      method: 'PUT',
      headers: {
        Authorization: `Basic ${ Buffer.from('duan02728596:bd00d08e-1a20-11ed-b2af-0242ac130006').toString('base64') }`,
        'Content-Type': 'application/json'
      }
    }, function(res: IncomingMessage): void {
      let result: string = '';

      res.on('data', function(data: Buffer): void {
        result += data.toString();
      });

      res.on('error', function(err: Error): void {
        reject(err);
      });

      res.on('end', function(): void {
        resolve(JSON.parse(result));
      });
    });

    req.on('error', function(err: Error) {
      reject(err);
    });
    req.end(JSON.stringify({
      format: 'urls'
    }));
  });
}

export default async function(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    const iceServer: XirsysIceServer = await getIceServer();

    res.status(200).json(iceServer);
  } catch (err) {
    res.status(400).json(err);
  }
}