import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

// Inject Telegram initData from WebApp
export function setInitData(initData: string) {
  api.defaults.headers.common['x-telegram-init-data'] = initData;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function fetchSocketToken() {
  const { data } = await api.get('/auth/socket-token');
  return data.token as string;
}

export async function fetchTournaments() {
  const { data } = await api.get('/tournaments');
  return data.tournaments;
}

export async function joinTournament(id: number, payload: any) {
  const { data } = await api.post(`/tournaments/${id}/join`, payload);
  return data;
}

export async function createPaymentIntent(tournamentId: number) {
  const { data } = await api.post('/payments/intent', { tournamentId });
  return data as { memo: string; amount: number; wallet: string };
}

export async function verifyPayment(body: { memo: string; fromAddress: string; amountNano: string }) {
  const { data } = await api.post('/payments/verify', body);
  return data;
}

export async function leaderboard(id: number) {
  const { data } = await api.get(`/tournaments/${id}/leaderboard`);
  return data.leaderboard;
}

export async function adminParticipants(id: number, adminKey: string) {
  const { data } = await api.get(`/admin/tournaments/${id}/participants`, { headers: { 'x-admin-key': adminKey } });
  return data.participants;
}

export async function adminMatches(id: number, adminKey: string) {
  const { data } = await api.get(`/admin/tournaments/${id}/matches`, { headers: { 'x-admin-key': adminKey } });
  return data.matches;
}

export async function adminCreateTournament(body: { title: string; entry_fee: number; prize_pool: number; game_type: string }, adminKey: string) {
  const { data } = await api.post('/tournaments', body, { headers: { 'x-admin-key': adminKey } });
  return data.tournament;
}

export async function adminStartTournament(id: number, adminKey: string) {
  const { data } = await api.post(`/tournaments/${id}/start`, {}, { headers: { 'x-admin-key': adminKey } });
  return data;
}

export async function adminCompleteTournament(id: number, adminKey: string) {
  const { data } = await api.post(`/tournaments/${id}/complete`, {}, { headers: { 'x-admin-key': adminKey } });
  return data;
}

export default api;
