import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;
const api = axios.create({
  baseURL: API_BASE,
});

const DEV_NO_API = !API_BASE;

const mockTournaments = [
  { id: 1, title: 'Mega Cup', entry_fee: 0, prize_pool: 2500, game_type: 'arcade' },
  { id: 2, title: 'Sprint Clash', entry_fee: 0, prize_pool: 1200, game_type: 'chess' }
];

async function mock<T>(data: T) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(data), 80));
}

// Inject Telegram initData from WebApp
export function setInitData(initData: string) {
  if (initData) api.defaults.headers.common['x-telegram-init-data'] = initData;
}

export async function fetchMe() {
  if (DEV_NO_API) return null;
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function fetchSocketToken() {
  if (DEV_NO_API) throw new Error('WS disabled in dev (no API_BASE)');
  const { data } = await api.get('/auth/socket-token');
  return data.token as string;
}

export async function fetchTournaments() {
  if (DEV_NO_API) return mock(mockTournaments);
  const { data } = await api.get('/tournaments');
  return data.tournaments;
}

export async function joinTournament(id: number, payload: any) {
  if (DEV_NO_API) return mock({ ok: true, joined: true });
  const { data } = await api.post(`/tournaments/${id}/join`, payload);
  return data;
}

export async function createPaymentIntent(tournamentId: number, token: string) {
  if (DEV_NO_API) return mock({ memo: 'dev-memo', amount: 0, wallet: 'dev', token });
  const { data } = await api.post('/payments/intent', { tournamentId, token });
  return data as { memo: string; amount: number; wallet: string; token: string };
}

export async function verifyPayment(body: { memo: string; fromAddress?: string; amountNano?: string; token?: string }) {
  if (DEV_NO_API) return mock({ status: 'verified-dev' });
  const { data } = await api.post('/payments/verify', body);
  return data;
}

export async function walletLink(tournamentId: number, token: string) {
  if (DEV_NO_API) return mock({ memo: 'dev', amount: 0, tonTransferUrl: '#', telegramWalletUrl: '#', token });
  const { data } = await api.get('/payments/wallet-link', { params: { tournamentId, token } });
  return data as { memo: string; amount: number; tonTransferUrl: string; telegramWalletUrl: string; token: string };
}

export async function paymentStatus(memo: string) {
  if (DEV_NO_API) return mock({ status: 'pending', payment: null });
  const { data } = await api.get('/payments/status', { params: { memo } });
  return data as { status: string; payment: any };
}

export async function leaderboard(id: number) {
  if (DEV_NO_API) return mock([{ id: 1, username: 'dev_player', wins: 3 }]);
  const { data } = await api.get(`/tournaments/${id}/leaderboard`);
  return data.leaderboard;
}

export async function adminParticipants(id: number, adminKey: string) {
  if (DEV_NO_API) return mock([]);
  const { data } = await api.get(`/admin/tournaments/${id}/participants`, { headers: { 'x-admin-key': adminKey } });
  return data.participants;
}

export async function adminMatches(id: number, adminKey: string) {
  if (DEV_NO_API) return mock([]);
  const { data } = await api.get(`/admin/tournaments/${id}/matches`, { headers: { 'x-admin-key': adminKey } });
  return data.matches;
}

export async function adminCreateTournament(body: { title: string; entry_fee: number; prize_pool: number; game_type: string }, adminKey: string) {
  if (DEV_NO_API) return mock({ id: Date.now(), ...body });
  const { data } = await api.post('/tournaments', body, { headers: { 'x-admin-key': adminKey } });
  return data.tournament;
}

export async function adminStartTournament(id: number, adminKey: string) {
  if (DEV_NO_API) return mock({ ok: true, id });
  const { data } = await api.post(`/tournaments/${id}/start`, {}, { headers: { 'x-admin-key': adminKey } });
  return data;
}

export async function adminCompleteTournament(id: number, adminKey: string) {
  if (DEV_NO_API) return mock({ ok: true, id });
  const { data } = await api.post(`/tournaments/${id}/complete`, {}, { headers: { 'x-admin-key': adminKey } });
  return data;
}

export async function getRoom(matchId: number) {
  if (DEV_NO_API) return mock({ code: 'DEV', password: '0000' });
  const { data } = await api.get(`/matches/${matchId}/room`);
  return data.room;
}

export async function createRoom(matchId: number, adminKey: string) {
  if (DEV_NO_API) return mock({ code: 'DEV', password: '0000' });
  const { data } = await api.post(`/matches/${matchId}/room`, {}, { headers: { 'x-admin-key': adminKey } });
  return data.room;
}

export async function myMatches() {
  if (DEV_NO_API) return mock([]);
  const { data } = await api.get('/matches');
  return data.matches;
}

export async function matchState(matchId: number) {
  if (DEV_NO_API) return mock({ match: null, fen: '' });
  const { data } = await api.get(`/matches/${matchId}/state`);
  return data;
}

export async function move(matchId: number, body: { from: string; to: string; promotion?: string }) {
  if (DEV_NO_API) return mock({ ok: true });
  const { data } = await api.post(`/matches/${matchId}/move`, body);
  return data;
}

export async function createCasual(game_type?: string) {
  if (DEV_NO_API) return mock({ code: 'DEV', match: { id: Date.now(), game_type, status: 'pending' } });
  const { data } = await api.post('/casual/create', { game_type });
  return data as { code: string; match: any };
}

export async function joinCasual(code: string) {
  if (DEV_NO_API) return mock({ match: { id: Date.now(), game_type: 'dev', status: 'pending' } });
  const { data } = await api.post('/casual/join', { code });
  return data as { match: any };
}

// placeholder for future match start screen data
export async function fetchMatchIntro(matchId: number) {
  if (DEV_NO_API) return mock({ matchId, intro: 'dev' });
  const { data } = await api.get(`/matches/${matchId}/state`);
  return data;
}

export async function fetchGamesRegistry() {
  if (DEV_NO_API) {
    return mock([
      { id: 1, name: 'Blitz Chess', type: 'strategy', tags: ['featured', 'trending'], players_online: 342, prize_pool: 250, difficulty: 'Medium' },
      { id: 2, name: 'Reaction Duel', type: 'reaction', tags: ['featured'], players_online: 290, prize_pool: 120, difficulty: 'Easy' },
      { id: 3, name: 'Quick Strategy Battle', type: 'strategy', tags: ['trending'], players_online: 180, prize_pool: 180, difficulty: 'Hard' },
      { id: 4, name: 'Arcade Score Challenge', type: 'arcade', tags: ['new'], players_online: 210, prize_pool: 90, difficulty: 'Medium' },
      { id: 5, name: 'Duel Rush', type: 'duel', tags: ['trending'], players_online: 150, prize_pool: 110, difficulty: 'Medium' }
    ]);
  }
  const { data } = await api.get('/games');
  return data.games || [];
}

export default api;
