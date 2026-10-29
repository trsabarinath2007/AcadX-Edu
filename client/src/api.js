
import axios from "axios";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://acadx-edu.onrender.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function apiGet(url, config) {
  const { data } = await api.get(url, config);
  return data;
}

export async function apiPost(url, body, config) {
  const { data } = await api.post(url, body, config);
  return data;
}

export async function apiPatch(url, body, config) {
  const { data } = await api.patch(url, body, config);
  return data;
}

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("acadx_user") || "null");
  } catch {
    return null;
  }
}
