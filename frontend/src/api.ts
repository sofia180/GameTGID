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

export async function fetchTournaments() {
  const { data } = await api.get('/tournaments');
  return data.tournaments;
}

export async function joinTournament(id: number, payload: any) {
  const { data } = await api.post(`/tournaments/${id}/join`, payload);
  return data;
}

export async function leaderboard(id: number) {
  const { data } = await api.get(`/tournaments/${id}/leaderboard`);
  return data.leaderboard;
}

export default api;
