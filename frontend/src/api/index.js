// src/api/index.js
import { api, saveTokens, clearTokens } from "./client";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email, password) => {
    const data = await api.post("/auth/login/", { email, password });
    saveTokens({ access: data.access, refresh: data.refresh });
    localStorage.setItem("mb_user", JSON.stringify(data.user));
    return data.user;
  },
  logout: () => {
    clearTokens();
    localStorage.removeItem("mb_user");
  },
  me: () => api.get("/users/me/"),
  changePassword: (new_password) => api.post("/users/me/change-password/", { new_password }),
};

// ── Users (gestor) ────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get("/users/"),
  create: (data) => api.post("/users/", data),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  resetPassword: (id, temp_password = "1234") =>
    api.post(`/users/${id}/reset-password/`, { temp_password }),
};

// ── Horarios ──────────────────────────────────────────────────────────────────
export const horariosApi = {
  // Concrete slots for a date
  list: (date, modalidade = "crossfit") => api.get(`/horarios/?data=${date}&modalidade=${modalidade}`),
  create: (data) => api.post("/horarios/create/", data),
  update: (id, data) => api.patch(`/horarios/${id}/`, data),
  delete: (id) => api.delete(`/horarios/${id}/`),

  // Check-in
  checkin: (horarioId) => api.post(`/horarios/${horarioId}/checkin/`, {}),
  release: (horarioId) => api.delete(`/horarios/${horarioId}/checkin/`),

  // Templates (weekly schedule)
  templates: {
    list: (modalidade = "crossfit") => api.get(`/horarios/templates/?modalidade=${modalidade}`),
    create: (data) => api.post("/horarios/templates/", data),
    update: (id, data) => api.patch(`/horarios/templates/${id}/`, data),
    delete: (id) => api.delete(`/horarios/templates/${id}/`),
    replicate: (dia_semana, modalidade = "crossfit") => api.post("/horarios/templates/replicar/", { dia_semana, modalidade }),
  },
};

// ── Planos ────────────────────────────────────────────────────────────────────
export const planosApi = {
  list: () => api.get("/planos/"),
  create: (data) => api.post("/planos/", data),
  update: (id, data) => api.patch(`/planos/${id}/`, data),
  delete: (id) => api.delete(`/planos/${id}/`),

  // Payments
  getPagamentos: (userId) => api.get(`/planos/pagamentos/${userId}/`),
  togglePagamento: (userId, mes) => api.post(`/planos/pagamentos/${userId}/`, { mes }),
};

// ── Config ────────────────────────────────────────────────────────────────────
export const configApi = {
  get: () => api.get("/config/"),
  update: (data) => api.patch("/config/", data),
};

// ── Invite (gestor) ───────────────────────────────────────────────────────────
export const inviteApi = {
  get: () => api.get("/users/invite/"),
  regenerate: () => api.post("/users/invite/"),
};

// ── Public registration (no auth needed) ──────────────────────────────────────
export const registerApi = {
  validate: (token) => api.get(`/users/register/${token}/`),
  register: (token, data) => api.post(`/users/register/${token}/`, data),
};
