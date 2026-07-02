import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://optiview-backend.onrender.com/api';
const TOKEN_KEY = 'optiview_token';

export const tokenStore = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (t) => SecureStore.setItemAsync(TOKEN_KEY, t),
  clear: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach token on every request
client.interceptors.request.use(async (config) => {
  const token = await tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token (AuthContext will react and show login)
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await tokenStore.clear();
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (data) => client.post('/auth/login', data),
  register: (data) => client.post('/auth/register', data),
  me: () => client.get('/auth/me'),
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }),
  resetPassword: (data) => client.post('/auth/reset-password', data),
};

export const panoramaAPI = {
  getStores: () => client.get('/panorama/stores'),
  getStore: (id) => client.get(`/panorama/stores/${id}`),
};

export const clientsAPI = {
  getClients: (params) => client.get('/clients', { params }),
  getClientById: (id) => client.get(`/clients/${id}`),
  createClient: (data) => client.post('/clients', data),
  updateClient: (id, data) => client.put(`/clients/${id}`, data),
  deleteClient: (id) => client.delete(`/clients/${id}`),
  getStats: () => client.get('/clients/stats'),
  createPrescription: (clientId, data) => client.post(`/clients/${clientId}/prescriptions`, data),
  deletePrescription: (id) => client.delete(`/clients/prescriptions/${id}`),
  upcomingAppointments: () => client.get('/clients/appointments/upcoming'),
  getAppointments: (clientId) => client.get(`/clients/${clientId}/appointments`),
  createAppointment: (clientId, data) => client.post(`/clients/${clientId}/appointments`, data),
  updateAppointmentStatus: (clientId, apptId, status) => client.put(`/clients/${clientId}/appointments/${apptId}`, { status }),
  deleteAppointment: (clientId, apptId) => client.delete(`/clients/${clientId}/appointments/${apptId}`),
};

export const eyewearAPI = {
  getFrames: (params) => client.get('/eyewear/frames', { params }),
  getStats: () => client.get('/eyewear/frames/stats'),
  createFrame: (data) => client.post('/eyewear/frames', data),
  updateFrame: (id, data) => client.put(`/eyewear/frames/${id}`, data),
  updateStock: (id, stock) => client.put(`/eyewear/frames/${id}/stock`, { stock }),
  deleteFrame: (id) => client.delete(`/eyewear/frames/${id}`),
};

export const lensesAPI = {
  getLenses: (params) => client.get('/lenses', { params }),
  getStats: () => client.get('/lenses/stats'),
  createLens: (data) => client.post('/lenses', data),
  updateLens: (id, data) => client.put(`/lenses/${id}`, data),
  updateStock: (id, stock) => client.put(`/lenses/${id}/stock`, { stock }),
  deleteLens: (id) => client.delete(`/lenses/${id}`),
};

export const atelierAPI = {
  getKanban: () => client.get('/atelier/orders/kanban'),
  getOrders: (params) => client.get('/atelier/orders', { params }),
  getStats: () => client.get('/atelier/orders/stats'),
  createOrder: (data) => client.post('/atelier/orders', data),
  updateOrder: (id, data) => client.put(`/atelier/orders/${id}`, data),
  updateStatus: (id, status) => client.put(`/atelier/orders/${id}/status`, { status }),
  deleteOrder: (id) => client.delete(`/atelier/orders/${id}`),
  getInvoice: (id) => client.get(`/atelier/orders/${id}/invoice`, { responseType: 'arraybuffer' }),
};

export const usersAPI = {
  getMyShop: () => client.get('/users/my-shop'),
  updateMyShop: (data) => client.patch('/users/my-shop', data),
  listEmployees: () => client.get('/users/employees'),
  createEmployee: (data) => client.post('/users/employees', data),
  setEmployeeActive: (id, active) => client.patch(`/users/employees/${id}/active`, { active }),
  deleteEmployee: (id) => client.delete(`/users/employees/${id}`),
};

export default client;
