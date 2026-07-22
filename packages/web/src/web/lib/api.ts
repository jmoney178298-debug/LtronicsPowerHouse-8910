import { hc } from "hono/client";
import type { AppType } from "../../api";
import { getToken } from "./auth";

const client = hc<AppType>("/", {
  headers: () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
export const api = client.api;
