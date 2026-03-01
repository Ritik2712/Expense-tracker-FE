import axios from "axios";
import { clearStoredUser, getStoredUser } from "./auth";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/",
});

api.interceptors.request.use((config) => {
  const user = getStoredUser();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const isAuthPage =
        path === "/login" || path === "/register" || path === "/register-admin";

      if (status === 401 && !isAuthPage) {
        clearStoredUser();
        if (path !== "/login") {
          window.location.replace("/login");
        }
      }

      if (status === 403 && path !== "/forbidden") {
        window.location.replace("/forbidden");
      }
    }

    return Promise.reject(error);
  },
);

export function getErrorMessage(error) {
  if (error?.response?.data?.detail?.message)
    return error.response.data.detail.message;
  if (error?.response?.data?.detail) {
    if (typeof error.response.data.detail === "string")
      return error.response.data.detail;
    if (error.response.data.detail.message)
      return error.response.data.detail.message;
  }
  return error?.message || "Something went wrong";
}
