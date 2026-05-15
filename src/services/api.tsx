import axios from "axios";

// Axios instance
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://gpt.procease.co/gp-backend/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Ensure cookies are sent along with requests
});

// Token Refresh Handling
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) =>
  refreshSubscribers.push(cb);

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const refreshApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/authentication`,
  withCredentials: true,
});

const refreshToken = async () => {
  try {
    const res = await refreshApi.get("/refresh-token");
    const newToken = res.data.accessToken;
    localStorage.setItem("accessToken", newToken);
    return newToken;
  } catch (err) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw err;
  }
};

// Request Interceptor: Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, attempt to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Wait for token refresh if another request is in progress
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        isRefreshing = false;
        onRefreshed(newToken);
        return api(originalRequest);
      } catch (err) {
        isRefreshing = false;
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

// API Endpoints
const ENDPOINTS = {
  // Looms
  getByLoomType: (loomtype: string) => api.get(`loom/type/${loomtype}`),
  getLoomType: () => api.get("/loom/loom-options"),
  getLoomById: (id: string) => api.get(`/loom/get/${id}`),

  //daily production
  getDailyProduction: (date: string) =>
    api.get(`/production/list?date=${date}`),
  getWeeklyTrend: (start: string, end: string) =>
    api.get(`production/weekly-trend?start=${start}&end=${end}`),
  updateProduction: (data: any) => api.put(`/production/update`, data),
  getMonthlyTrend: (start: string, end: string) =>
    api.get(`production/monthly-trend?start=${start}&end=${end}`),

  // delivery schedule
  createDeliverySchedule: (data: any) =>
    api.post("deliveryschedule/create", data),
  getAllDeliverySchedules: () => api.get("deliveryschedule/list"),
  getDeliveryScheduleById: (scheduleId: string) =>
    api.get(`/deliveryschedule/get/${scheduleId}`),
  updateDeliverySchedule: (scheduleId: string, data: any) =>
    api.put(`/deliveryschedule/update/${scheduleId}`, data),

  // Orders
  createOrder: (orderData: Record<string, any>) =>
    api.post("/order/create", orderData),
  getOrdersList: () => api.get("/order/list"),
  getOrderById: (id: string | number) => api.get(`/order/get/${id}`),
  deleteOrder: (id: string | number) => api.delete(`/order/delete/${id}`),
  updateOrder: (id: string | number, data: any) =>
    api.put(`/order/update/${id}`, data),
  updateTAPlan: (id: string | number, payload: any) =>
    api.put(`/order/update/timeaction/${id}`, payload),

  //beam reconciliation
  createBeamReconciliation: (data: any) =>
    api.post("beamreconciliation/create", data),
  getBeamReconciliationList: () => api.get("beamreconciliation/list"),
  getBeamReconciliationById: (id: string) =>
    api.get(`/beamreconciliation/get/${id}`),
  updateBeamReconciliation: (id: string, data: any) =>
    api.put(`/beamreconciliation/update/${id}`, data),
};

export default ENDPOINTS;
