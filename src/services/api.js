import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Matéria-Prima ──────────────────────────────────────────────
export const getMateriaPrima = (search) =>
  api.get('/materia-prima', { params: search ? { search } : {} });

export const getMateriaPrimaById = (id) =>
  api.get(`/materia-prima/${id}`);

export const createMateriaPrima = (data) =>
  api.post('/materia-prima', data);

export const updateMateriaPrima = (id, data) =>
  api.put(`/materia-prima/${id}`, data);

export const deleteMateriaPrima = (id) =>
  api.delete(`/materia-prima/${id}`);

export const getQRCode = (id) =>
  api.get(`/materia-prima/${id}/qrcode`);

// ── Stocks / Movimentações ─────────────────────────────────────
export const getMovimentacoes = (params) =>
  api.get('/stocks', { params });

export const getDashboard = () =>
  api.get('/stocks/dashboard');

export const registarMovimento = (data) =>
  api.post('/stocks', data);

export default api;
