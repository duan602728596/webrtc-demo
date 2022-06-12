declare const Pusher: any;
declare const process: any;

Pusher.logToConsole = process.env.NODE_ENV === 'development';

export const pusher: typeof Pusher = new Pusher('fc1812ec5b44141b56f5', {
  cluster: 'us2'
});

export let channel: any = null;

export function pusherInstance(pusherId: string): any {
  channel = pusher.subscribe(pusherId);

  return channel;
}

export function pusherDestroy(pusherId: string): any {
  pusher.unsubscribe(pusherId);
  channel = null;
}