import { getToken } from "./auth";

/** fetch wrapper that attaches the bearer token — use for raw fetch() calls to protected routes */
export function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
