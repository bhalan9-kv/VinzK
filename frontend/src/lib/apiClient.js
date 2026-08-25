import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const getToken = () => localStorage.getItem("case_token");
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("case_user") || "null"); }
  catch { return null; }
};
export const setSession = (token, user) => {
  localStorage.setItem("case_token", token);
  localStorage.setItem("case_user", JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem("case_token");
  localStorage.removeItem("case_user");
};

// Fires a browser event when auth becomes invalid so React can open the sign-in modal.
export const onAuthLost = (handler) => {
  window.addEventListener("case:auth-lost", handler);
  return () => window.removeEventListener("case:auth-lost", handler);
};
const emitAuthLost = () => window.dispatchEvent(new CustomEvent("case:auth-lost"));

export const client = () => {
  const instance = axios.create({
    baseURL: API,
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  });
  instance.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err?.response?.status === 401) {
        // Clear any stale token and let the app re-prompt for sign-in.
        clearSession();
        emitAuthLost();
      }
      return Promise.reject(err);
    }
  );
  return instance;
};
