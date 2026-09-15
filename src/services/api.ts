import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url ?? "";

    const isAuthRoute =
      requestUrl.includes("/Auth/login") ||
      requestUrl.includes("/Auth/change-password");

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("employeeId");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
