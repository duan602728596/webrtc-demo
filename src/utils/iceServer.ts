interface XirsysIceServer {
  v: {
    iceServers: RTCIceServer;
  };
}

let iceServer: RTCIceServer | undefined = undefined;

// Get server from: https://global.xirsys.net/dashboard/services
async function getTurnServer(): Promise<RTCIceServer> {
  const res: Response = await fetch('/api/ice');
  const data: XirsysIceServer = await res.json();

  return data.v.iceServers;
}

export async function getIceServer(): Promise<RTCIceServer> {
  if (!iceServer) {
    iceServer = await getTurnServer();
  }

  return iceServer;
}