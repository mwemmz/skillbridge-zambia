import axios from "axios";

const api = axios.create({
  baseURL: "",
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("sb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem("sb_token");
      sessionStorage.removeItem("sb_user");
    }
    return Promise.reject(err);
  }
);

export function serverError(err, fallback) {
  if (!err.response) {
    return (
      "Cannot reach the SkillBridge server. Make sure the backend is running " +
      "(start-backend.cmd), then try again."
    );
  }
  if (err.response.status >= 500) {
    return (
      "The server is still starting up or unavailable. Wait a few seconds, " +
      "then try again."
    );
  }
  return err.response?.data?.detail || fallback || "Something went wrong. Try again.";
}

export default api;
