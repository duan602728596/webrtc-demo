import Pusher from 'pusher';
import type { NextApiRequest, NextApiResponse } from 'next';

const pusher: Pusher = new Pusher({
  appId: '1418886',
  key: 'fc1812ec5b44141b56f5',
  secret: 'ded7a9eadf0cab706231',
  cluster: 'us2',
  useTLS: true
});

interface SetPusherPayload {
  id: string;
  targetId: string;
  token: string;
  [key: string]: any;
}

interface SetPusherAction {
  type: string;
  payload: SetPusherPayload;
}

export default async function(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const body: SetPusherAction = req.body;

  await pusher.trigger(body.payload.targetId, body.type, body);
  res.status(200).json({ code: 0 });
}