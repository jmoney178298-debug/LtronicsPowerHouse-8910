import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Search, X } from "lucide-react";
import { api } from "../lib/api";
import { ProductCard } from "../components/ProductCard";

const CATEGORIES = [
  "All",
  "T-Shirts",
  "Hoodies",
  "Hats",
  "Accessories",
  "Phones / Electronics",
  "Cables & Chargers",
  "Speakers / Headphones",
  "Backpacks",
  "Stickers",
];

export default function ShopPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCategory = params.get("category") || "All";

  const [category, setCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(search);
    const cat = p.get("category");
    if (cat) setCategory(cat);
  }, [search]);

  const products = useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      const res = await api.products.$get({
        query: { category: category !== "All" ? category : undefined },
      });
      return res.json();
    },
  });

  const filtered = (products.data?.products ?? []).filter((p) => {
    if (!searchTerm) return true;
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-5">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--tx)" }}>
            The Collection
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="font-display text-5xl">SHOP ALL</h1>
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {filtered.length} products
            </span>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <div
            className="flex-1 flex items-center gap-2 px-4 rounded-lg"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Search size={16} style={{ color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent flex-1 py-2.5 text-sm outline-none"
              style={{ color: "var(--text)" }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}>
                <X size={14} style={{ color: "var(--muted)" }} />
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: category === cat ? "var(--tx)" : "var(--card)",
                color: category === cat ? "#fff" : "var(--muted)",
                border: `1px solid ${category === cat ? "var(--tx)" : "var(--border)"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {products.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{ background: "var(--card)", height: 300 }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="font-display text-4xl" style={{ color: "var(--border)" }}>NO RESULTS</div>
            <p style={{ color: "var(--muted)" }}>Try a different category or search term</p>
            <button
              onClick={() => { setCategory("All"); setSearchTerm(""); }}
              className="px-6 py-2 rounded font-bold text-white"
              style={{ background: "var(--tx)" }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
