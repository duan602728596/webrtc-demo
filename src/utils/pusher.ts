import Pusher, { type Channel } from 'pusher-js';

declare const process: any;

Pusher.logToConsole = process.env.NODE_ENV === 'development';

export const pusher: Pusher = new Pusher('fc1812ec5b44141b56f5', {
  cluster: 'us2'
});

export let channel: Channel | null = null;

export function pusherInstance(pusherId: string): Channel {
  channel = pusher.subscribe(pusherId);

  return channel;
}

export function pusherDestroy(pusherId: string): void {
  pusher.unsubscribe(pusherId);
  channel = null;
}