import { API_BASE_URL, DEMO_MODE } from "../config";

const normalizedApiBaseUrl = DEMO_MODE ? "" : API_BASE_URL.replace(/\/$/, "");

export function apiUrl(path: string) {
  if (!path) return normalizedApiBaseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  if (DEMO_MODE) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  return `${normalizedApiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
