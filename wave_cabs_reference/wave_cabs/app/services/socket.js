// socket.js
import { io } from 'socket.io-client';

// ✅ Use YOUR SERVER URL
const SOCKET_SERVER_URL = 'https://server.wavecabs.com';

// ✅ Export SINGLE instance — REUSE it across screens!
export const socket = io(SOCKET_SERVER_URL, {
  path: '/Socket/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('connect', () => {
  console.log('✅ [Rider] Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ [Rider] Socket disconnected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.log('❌ [Rider] Socket connection error:', err.message);
});
