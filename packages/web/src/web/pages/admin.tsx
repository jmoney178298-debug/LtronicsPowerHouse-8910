import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Edit2, Trash2, Package, ShoppingBag, DollarSign,
  X, Check, Loader2, ChevronDown, ImagePlus,
  RefreshCw, Zap, AlertCircle, CheckCircle2
} from "lucide-react";
import { api } from "../lib/api";
import { authFetch } from "../lib/authFetch";
import { authClient, clearToken } from "../lib/auth";
import { Redirect } from "wouter";
import { AdminBlogTab } from "../components/AdminBlogTab";
import { AdminPromoTab } from "../components/AdminPromoTab";
import { AdminCustomRequestsTab } from "../components/AdminCustomRequestsTab";
import { AdminRewardsTab } from "../components/AdminRewardsTab";

const CATEGORIES = [
  "T-Shirts", "Hoodies/Sweatshirts", "Hats/Caps", "Accessories",
  "Phones / Electronics", "Cables & Chargers",
  "Speakers / Headphones", "Backpacks", "Stickers",
];

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  images: string[];
  stock: string;
  featured: boolean;
  sizesInput: string;
  colorsInput: string;
}

const EMPTY_FORM: ProductForm = {
  name: "", description: "", price: "", category: "T-Shirts",
  imageUrl: "", images: [], stock: "99", featured: false,
  sizesInput: "", colorsInput: "",
};

/** Build a simple manual variants array from comma-separated size/color lists (informational —
 * no real Printful variantId, just lets customers indicate a preference on manual products). */
function buildManualVariants(sizesInput: string, colorsInput: string, price: number) {
  const sizes = sizesInput.split(",").map((s) => s.trim()).filter(Boolean);
  const colors = colorsInput.split(",").map((c) => c.trim()).filter(Boolean);
  if (sizes.length === 0 && colors.length === 0) return [];
  const sizeList = sizes.length > 0 ? sizes : [""];
  const colorList = colors.length > 0 ? colors : [""];
  const variants = [];
  for (const color of colorList) {
    for (const size of sizeList) {
      variants.push({ variantId: "", size, color, price, inStock: true });
    }
  }
  return variants;
}

// ── Image Upload Widget ─────────────────────────────────────────────────────
function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadErr(null);
    try {
      const presignRes = await authFetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { url, publicUrl } = await presignRes.json();
      const putRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");
      onChange(publicUrl);
    } catch (err: any) {
      setUploadErr(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted)" }}>
        Product Image
      </label>

      {/* Hidden file input — no capture so phone shows full picker (gallery + camera) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
          e.target.value = "";
        }}
      />

      {/* Image preview box OR add button */}
      {value ? (
        <div className="relative w-full rounded-xl overflow-hidden" style={{ border: "1.5px solid var(--border)", background: "var(--card)" }}>
          <img src={value} alt="Product" className="w-full h-48 object-cover" />
          {/* Change / remove bar */}
          <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-2" style={{ background: "rgba(0,0,0,0.7)" }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ background: "var(--tx)", color: "#000" }}
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              {uploading ? "Uploading..." : "Change Photo"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-3 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all hover:opacity-80 disabled:opacity-50"
          style={{
            background: "rgba(232,96,10,0.08)",
            border: "2px dashed rgba(232,96,10,0.5)",
            color: "var(--tx)",
          }}
        >
          {uploading
            ? <><Loader2 size={18} className="animate-spin" /> Uploading...</>
            : <><ImagePlus size={18} /> Add Image</>
          }
        </button>
      )}

      {uploadErr && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: "var(--danger)" }}>
          <AlertCircle size={11} /> {uploadErr}
        </div>
      )}

    </div>
  );
}

// ── Gallery Images Widget (extra product photos) ───────────────────────────
function GalleryUploader({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadErr(null);
    try {
      const presignRes = await authFetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { url, publicUrl } = await presignRes.json();
      const putRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");
      onChange([...value, publicUrl]);
    } catch (err: any) {
      setUploadErr(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted)" }}>
        Extra Photos (gallery)
      </label>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.85)", color: "#fff" }}
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all hover:opacity-80 disabled:opacity-50"
        style={{
          background: "rgba(0,170,255,0.08)",
          border: "1.5px dashed rgba(0,170,255,0.5)",
          color: "var(--co)",
        }}
      >
        {uploading
          ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
          : <><ImagePlus size={14} /> Add Gallery Photo</>
        }
      </button>

      {uploadErr && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: "var(--danger)" }}>
          <AlertCircle size={11} /> {uploadErr}
        </div>
      )}
    </div>
  );
}

// ── Admin Login Gate ─────────────────────────────────────────────────────────
function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { captureToken } = await import("../lib/auth");
      const result = await authClient.signIn.email(
        { email, password },
        { onSuccess: captureToken }
      );
      if (result.error) {
        setErr(result.error.message || "Invalid email or password");
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setErr(err?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-24 pb-20">
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--tx)" }}>
          Restricted Access
        </div>
        <h1 className="font-display text-3xl mb-6">ADMIN LOGIN</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-alt)", border: "1px solid var(--border)", color: "var(--text)" }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-alt)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          {err && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--danger)" }}>
              <AlertCircle size={11} /> {err}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            style={{ background: "var(--tx)" }}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in...</> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Admin Page ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--tx)" }} />
      </div>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  return <AdminDashboard onSignOut={async () => { await authClient.signOut(); clearToken(); window.location.reload(); }} />;
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"products" | "orders" | "blog" | "promo" | "custom" | "rewards">("products");
  const [modalOpen, setModalOpen] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Products query
  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });

  // Orders query
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await authFetch("/api/orders");
      return res.json();
    },
    enabled: tab === "orders",
  });

  // Create product
  const createProduct = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.products.$post({ json: data });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
  });

  // Update product
  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await api.products[":id"].$put({ param: { id: String(id) }, json: data });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
  });

  // Sync Printful — robust error handling
  const syncPrintful = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/printful/sync", { method: "POST" });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = { error: `Non-JSON response: ${text.slice(0, 100)}` }; }
      if (!res.ok) throw new Error(data?.error || `Server error ${res.status}`);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setSyncMsg({ text: data?.message || `Synced ${data?.synced ?? 0} products`, ok: true });
      setTimeout(() => setSyncMsg(null), 6000);
    },
    onError: (err: any) => {
      setSyncMsg({ text: `Error: ${err?.message || "Unknown"}`, ok: false });
      setTimeout(() => setSyncMsg(null), 8000);
    },
  });

  // Delete product
  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.products[":id"].$delete({ param: { id: String(id) } });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditProduct(p);
    let existingImages: string[] = [];
    try {
      existingImages = p.images ? JSON.parse(p.images) : [];
    } catch {
      existingImages = [];
    }
    let sizesInput = "";
    let colorsInput = "";
    if (p.source !== "printful") {
      try {
        const v = p.variantsData ? JSON.parse(p.variantsData) : [];
        sizesInput = Array.from(new Set(v.map((x: any) => x.size).filter(Boolean))).join(", ");
        colorsInput = Array.from(new Set(v.map((x: any) => x.color).filter(Boolean))).join(", ");
      } catch {}
    }
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      category: p.category,
      imageUrl: p.imageUrl,
      images: existingImages,
      stock: String(p.stock),
      featured: p.featured,
      sizesInput,
      colorsInput,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditProduct(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    const data: any = {
      name: form.name,
      description: form.description,
      price,
      category: form.category,
      imageUrl: form.imageUrl,
      images: form.images,
      stock: parseInt(form.stock),
      featured: form.featured,
    };
    // Only manual products can have admin-defined size/color options —
    // Printful products keep their real synced variant data.
    if (!editProduct || editProduct.source !== "printful") {
      data.variantsData = JSON.stringify(buildManualVariants(form.sizesInput, form.colorsInput, price));
    }
    if (editProduct) {
      updateProduct.mutate({ id: editProduct.id, data });
    } else {
      createProduct.mutate(data);
    }
  };

  const productList = products.data?.products ?? [];
  const orderList = orders.data?.orders ?? [];

  const totalRevenue = orderList
    .filter((o: any) => o.status === "paid")
    .reduce((sum: number, o: any) => sum + (o.total ?? 0), 0);

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-5">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--tx)" }}>
              Dashboard
            </div>
            <h1 className="font-display text-5xl">ADMIN PANEL</h1>
          </div>
          <button
            onClick={onSignOut}
            className="px-4 py-2 rounded-lg font-semibold text-xs transition-colors"
            style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "transparent" }}
          >
            Sign Out
          </button>
        </div>

        {/* Payment Info Banner */}
        <div className="mb-6 p-5 rounded-xl" style={{ background: "rgba(0,170,255,0.06)", border: "1px solid rgba(0,170,255,0.25)" }}>
          <div className="flex flex-wrap items-start gap-6">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--co)" }}>How You Get Paid</div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                Payments go through <strong style={{ color: "var(--text)" }}>Square</strong> → straight to your linked bank account.<br />
                Square supports: <strong style={{ color: "var(--text)" }}>Apple Pay · Google Pay · Cash App Pay · Credit/Debit cards</strong>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--tx)" }}>Direct CashApp</div>
              <a
                href="https://cash.app/$PowerHouseKingzCo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                style={{ background: "#00D64F", color: "#000" }}
              >
                <span style={{ fontSize: "16px" }}>$</span>
                $PowerHouseKingzCo
              </a>
              <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>For custom/direct orders</div>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>Setup Needed</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Go to <strong style={{ color: "var(--text)" }}>squareup.com</strong> → Settings → Bank Accounts<br />
                to link your payout bank account.
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Package size={20} />, label: "Products", value: productList.length },
            { icon: <ShoppingBag size={20} />, label: "Orders", value: orderList.length },
            { icon: <DollarSign size={20} />, label: "Revenue", value: `$${totalRevenue.toFixed(2)}` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-xl flex items-center gap-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--tx-soft)", color: "var(--tx)" }}
              >
                {stat.icon}
              </div>
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {(["products", "orders", "blog", "promo", "custom", "rewards"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2 rounded text-sm font-semibold capitalize transition-all"
              style={{
                background: tab === t ? "var(--tx)" : "transparent",
                color: tab === t ? "#000" : "var(--muted)",
              }}
            >
              {t === "blog" ? "Kingz Talk" : t === "promo" ? "Promo Codes" : t === "custom" ? "Custom Requests" : t === "rewards" ? "Rewards" : t}
            </button>
          ))}
        </div>

        {/* Products tab */}
        {tab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  {productList.length} products
                </span>
                {syncMsg && (
                  <span
                    className="flex items-center gap-1.5 text-xs px-3 py-1 rounded font-semibold"
                    style={{
                      background: syncMsg.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: syncMsg.ok ? "#22c55e" : "var(--danger)",
                      border: `1px solid ${syncMsg.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }}
                  >
                    {syncMsg.ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                    {syncMsg.text}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => syncPrintful.mutate()}
                  disabled={syncPrintful.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "rgba(0,170,255,0.15)", color: "var(--co)", border: "1px solid var(--co)" }}
                >
                  {syncPrintful.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  Sync Printful
                </button>
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-4 py-2 rounded font-bold text-white text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--tx)" }}
                >
                  <Plus size={14} />
                  Add Product
                </button>
              </div>
            </div>

            {products.isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin" style={{ color: "var(--tx)" }} />
              </div>
            ) : productList.length === 0 ? (
              <div className="py-20 text-center" style={{ color: "var(--muted)" }}>
                No products yet — sync Printful or add manually
              </div>
            ) : (
              <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                      {["Product", "Source", "Category", "Price", "Stock", "Featured", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productList.map((p: any, i: number) => (
                      <tr
                        key={p.id}
                        style={{
                          background: i % 2 === 0 ? "var(--bg-alt)" : "var(--bg)",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-10 h-10 object-cover rounded"
                                style={{ border: "1px solid var(--border)" }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded flex items-center justify-center"
                                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                              >
                                <ImagePlus size={14} style={{ color: "var(--muted)" }} />
                              </div>
                            )}
                            <span className="font-medium truncate max-w-[140px]">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.source === "printful" ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit"
                              style={{ background: "rgba(232,96,10,0.18)", color: "var(--tx)", border: "1px solid rgba(232,96,10,0.4)" }}
                            >
                              <Zap size={9} /> PRINTFUL
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold w-fit block"
                              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
                            >
                              MANUAL
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: "var(--tx-soft)", color: "var(--tx)" }}
                          >
                            {p.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--tx)" }}>
                          ${p.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ color: p.stock === 0 ? "var(--danger)" : "var(--text)" }}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.featured ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <X size={14} style={{ color: "var(--border)" }} />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded transition-colors hover:text-orange-400"
                              style={{ color: "var(--muted)" }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteId(p.id)}
                              className="p-1.5 rounded transition-colors hover:text-red-400"
                              style={{ color: "var(--muted)" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Orders tab */}
        {tab === "orders" && (
          <div>
            {orders.isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin" style={{ color: "var(--tx)" }} />
              </div>
            ) : orderList.length === 0 ? (
              <div className="py-20 text-center" style={{ color: "var(--muted)" }}>No orders yet</div>
            ) : (
              <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                      {["Order ID", "Email", "Status", "Total", "Date"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orderList.map((o: any, i: number) => (
                      <tr
                        key={o.id}
                        style={{
                          background: i % 2 === 0 ? "var(--bg-alt)" : "var(--bg)",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-xs">#{o.id}</td>
                        <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{o.email || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            style={{
                              background: o.status === "paid" ? "rgba(34,197,94,0.1)" : "rgba(0,170,255,0.1)",
                              color: o.status === "paid" ? "#22c55e" : "var(--co)",
                            }}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--tx)" }}>
                          ${o.total?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Kingz Talk (blog) tab */}
        {tab === "blog" && <AdminBlogTab />}

        {/* Promo codes tab */}
        {tab === "promo" && <AdminPromoTab />}

        {/* Custom requests tab */}
        {tab === "custom" && <AdminCustomRequestsTab />}

        {/* Rewards tab */}
        {tab === "rewards" && <AdminRewardsTab />}
      </div>

      {/* Product Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl flex flex-col max-h-[92vh] overflow-y-auto"
            style={{ background: "var(--bg-alt)", border: "1px solid var(--border)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-bold text-base">
                {editProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={closeModal} style={{ color: "var(--muted)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

              {/* Image Upload */}
              <ImageUploader
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
              />

              <GalleryUploader
                value={form.images}
                onChange={(urls) => setForm({ ...form, images: urls })}
              />

              {/* Name */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>
                  Product Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  placeholder="Crown Tee — Black Gold"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>
                  Category *
                </label>
                <div className="relative">
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none appearance-none"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
                </div>
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>
                    Price ($) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                    placeholder="34.99"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                    placeholder="99"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  placeholder="Product description..."
                />
              </div>

              {/* Manual size/color options — only for non-Printful products */}
              {(!editProduct || editProduct.source !== "printful") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>
                      Sizes (comma separated)
                    </label>
                    <input
                      value={form.sizesInput}
                      onChange={(e) => setForm({ ...form, sizesInput: e.target.value })}
                      placeholder="S, M, L, XL"
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>
                      Colors (comma separated)
                    </label>
                    <input
                      value={form.colorsInput}
                      onChange={(e) => setForm({ ...form, colorsInput: e.target.value })}
                      placeholder="Black, White"
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                </div>
              )}

              {/* Featured toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className="w-10 h-5 rounded-full relative transition-colors"
                  style={{ background: form.featured ? "var(--tx)" : "var(--border)" }}
                  onClick={() => setForm({ ...form, featured: !form.featured })}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-transform bg-white"
                    style={{ transform: form.featured ? "translateX(21px)" : "translateX(2px)" }}
                  />
                </div>
                <span className="text-sm">Featured on homepage</span>
              </label>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-lg font-semibold text-sm transition-colors"
                  style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "transparent" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="flex-1 py-3 rounded-lg font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "var(--tx)" }}
                >
                  {(createProduct.isPending || updateProduct.isPending) ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving...</>
                  ) : (
                    editProduct ? "Save Changes" : "Add Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "var(--bg-alt)", border: "1px solid var(--border)" }}
          >
            <h2 className="font-bold text-base mb-2">Delete Product?</h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded font-semibold text-sm"
                style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProduct.mutate(deleteId)}
                disabled={deleteProduct.isPending}
                className="flex-1 py-2.5 rounded font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "var(--danger)" }}
              >
                {deleteProduct.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
