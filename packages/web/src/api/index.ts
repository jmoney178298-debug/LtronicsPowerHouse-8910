import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { authMiddleware } from "./middleware/auth";
import { products } from "./routes/products";
import { orders } from "./routes/orders";
import { checkout } from "./routes/checkout";
import { upload } from "./routes/upload";
import { printful } from "./routes/printful";
import { blog } from "./routes/blog";
import { promo } from "./routes/promo";
import { referrals } from "./routes/referrals";
import { customRequests } from "./routes/custom-requests";

const app = new Hono()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath("api")
  .use("*", authMiddleware)
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/products", products)
  .route("/orders", orders)
  .route("/checkout", checkout)
  .route("/upload", upload)
  .route("/printful", printful)
  .route("/blog", blog)
  .route("/promo", promo)
  .route("/referrals", referrals)
  .route("/custom-requests", customRequests);

export type AppType = typeof app;
export default app;
