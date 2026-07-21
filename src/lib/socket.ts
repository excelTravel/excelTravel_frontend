import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { config } from './config';
import { getAuthToken } from './api/client';

// Shared Socket.io connection to the backend. The server authenticates the Clerk token in the handshake and
// authorizes trip rooms per request; we join a room to receive that trip's bus:location / bus:alert /
// trip:status events. One connection is shared across the app and lazily established on first use.

// The socket server is attached at the API origin (strip the /api/v1 suffix the REST client uses).
const SOCKET_URL = config.apiBaseUrl.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket'],
      // Refresh the Clerk token on every (re)connect so a rotated token still authenticates.
      auth: (cb) => { void getAuthToken().then((token) => cb({ token: token ?? '' })); },
    });
  }
  return socket;
}

export interface LiveLocation {
  vehicleId: string;
  driverId: string | null;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}
export interface LiveAlert { type: string; message: string }

export interface TripLive {
  connected: boolean;
  location: LiveLocation | null;
  alert: LiveAlert | null;
  status: string | null;
}

// Subscribe to one trip's live feed. Joins the room on mount, leaves on unmount, and keeps the latest
// location, most recent alert, and latest status. `onStatus` fires on every trip:status event (e.g. to
// refetch the trip). Pass a falsy tripId to stay idle.
export function useTripLive(tripId: string | undefined, onStatus?: (status: string) => void): TripLive {
  const [connected, setConnected] = useState(false);
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [alert, setAlert] = useState<LiveAlert | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    const s = getSocket();
    const join = () => { setConnected(true); s.emit('join:trip', tripId); };
    const onLocation = (dto: LiveLocation) => setLocation(dto);
    const onAlert = (a: LiveAlert) => setAlert(a);
    const onTripStatus = (payload: { status: string }) => { setStatus(payload.status); onStatus?.(payload.status); };

    if (s.connected) join();
    s.on('connect', join);
    s.on('disconnect', () => setConnected(false));
    s.on('bus:location', onLocation);
    s.on('bus:alert', onAlert);
    s.on('trip:status', onTripStatus);

    return () => {
      s.emit('leave:trip', tripId);
      s.off('connect', join);
      s.off('bus:location', onLocation);
      s.off('bus:alert', onAlert);
      s.off('trip:status', onTripStatus);
    };
  }, [tripId, onStatus]);

  return { connected, location, alert, status };
}
