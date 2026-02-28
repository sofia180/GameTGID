import { WebSocketServer } from 'ws';
import { eventBus } from '../utils/events.js';
import http from 'http';
import { verifySocketToken } from '../utils/jwt.js';

export function initWebsocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) {
      ws.close(4001, 'token required');
      return;
    }
    try {
      verifySocketToken(token);
    } catch (err) {
      ws.close(4002, 'invalid token');
      return;
    }
    ws.send(JSON.stringify({ type: 'welcome', ts: Date.now() }));
  });

  eventBus.on('match:created', (payload) => broadcast(wss, { type: 'match_created', payload }));
  eventBus.on('match:updated', (payload) => broadcast(wss, { type: 'match_updated', payload }));
  eventBus.on('tournament:updated', (payload) => broadcast(wss, { type: 'tournament_updated', payload }));
}

function broadcast(wss: WebSocketServer, data: any) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) client.send(msg);
  });
}
