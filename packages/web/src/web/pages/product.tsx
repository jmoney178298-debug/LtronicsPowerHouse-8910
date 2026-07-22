import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ShoppingCart, ArrowLeft, Star, Package, Zap } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";

interface Variant {
  variantId: string;
  size: string;
  color: string;
  price: number;
  inStock: boolean;
  imageUrl?: string;
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [variantError, setVariantError] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.products[":id"].$get({ param: { id: id! } });
      return res.json();
    },
    enabled: !!id,
  });

  const product = data?.product;

  let gallery: string[] = [];
  try {
    gallery = product?.images ? JSON.parse(product.images) : [];
  } catch {
    gallery = [];
  }
  const allImages = [product?.imageUrl, ...gallery].filter(Boolean) as string[];

  let variants: Variant[] = [];
  try {
    variants = product?.variantsData ? JSON.parse(product.variantsData) : [];
  } catch {
    variants = [];
  }
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
  const hasVariants = variants.length > 0 && (colors.length > 0 || sizes.length > 0);

  const selectedVariant = variants.find(
    (v) => (!colors.length || v.color === selectedColor) && (!sizes.length || v.size === selectedSize)
  );

  useEffect(() => {
    if (allImages.length > 0) setActiveImage(allImages[0]);
    if (colors.length > 0) setSelectedColor(colors[0]);
    if (sizes.length > 0) setSelectedSize(sizes[0]);
  }, [product?.id]);

  useEffect(() => {
    if (selectedVariant?.imageUrl) setActiveImage(selectedVariant.imageUrl);
  }, [selectedVariant?.variantId]);

  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse flex flex-col md:flex-row gap-10 max-w-5xl w-full mx-auto px-5">
          <div className="w-full md:w-1/2 rounded-xl" style={{ background: "var(--card)", height: 400 }} />
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-6 rounded" style={{ background: "var(--card)", width: "60%" }} />
            <div className="h-10 rounded" style={{ background: "var(--card)" }} />
            <div className="h-4 rounded" style={{ background: "var(--card)", width: "40%" }} />
            <div className="h-20 rounded" style={{ background: "var(--card)" }} />
            <div className="h-12 rounded" style={{ background: "var(--card)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-6xl mb-4" style={{ color: "var(--border)" }}>404</div>
          <p style={{ color: "var(--muted)" }}>Product not found</p>
          <Link to="/shop">
            <span className="mt-4 inline-block px-6 py-2 rounded font-bold text-white cursor-pointer" style={{ background: "var(--tx)" }}>
              Back to Shop
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link to="/shop">
            <span
              className="flex items-center gap-1 text-sm cursor-pointer transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLSpanElement).style.color = "#fff"}
              onMouseLeave={(e) => (e.currentTarget as HTMLSpanElement).style.color = "var(--muted)"}
            >
              <ArrowLeft size={14} />
              Back to Shop
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image */}
          <div className="flex flex-col gap-3">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <img
                src={activeImage || product.imageUrl || "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&q=80"}
                alt={product.name}
                className="w-full object-cover"
                style={{ maxHeight: 500 }}
              />
              {product.featured && (
                <div
                  className="absolute top-4 left-4 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
                  style={{ background: "var(--tx)", color: "#fff" }}
                >
                  <Star size={10} fill="#fff" /> FEATURED
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-3">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className="rounded-lg overflow-hidden flex-shrink-0 transition-all"
                    style={{
                      width: 72,
                      height: 72,
                      border: activeImage === img ? "2px solid var(--tx)" : "1px solid var(--border)",
                      opacity: activeImage === img ? 1 : 0.7,
                    }}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div>
              <div
                className="text-xs font-semibold tracking-widest uppercase mb-2"
                style={{ color: "var(--co)" }}
              >
                {product.category}
              </div>
              <h1 className="font-display text-4xl md:text-5xl mb-3">{product.name}</h1>
              <div className="text-3xl font-bold" style={{ color: "var(--tx)" }}>
                ${displayPrice.toFixed(2)}
              </div>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {product.description}
            </p>

            {/* Variant selectors */}
            {colors.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted)" }}>
                  Color: <span style={{ color: "var(--text)" }}>{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setSelectedColor(c); setVariantError(false); }}
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: selectedColor === c ? "var(--tx)" : "var(--card)",
                        color: selectedColor === c ? "#fff" : "var(--muted)",
                        border: `1px solid ${selectedColor === c ? "var(--tx)" : "var(--border)"}`,
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted)" }}>
                  Size: <span style={{ color: "var(--text)" }}>{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSelectedSize(s); setVariantError(false); }}
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: selectedSize === s ? "var(--co)" : "var(--card)",
                        color: selectedSize === s ? "#000" : "var(--muted)",
                        border: `1px solid ${selectedSize === s ? "var(--co)" : "var(--border)"}`,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {variantError && (
              <div className="text-xs" style={{ color: "var(--danger)" }}>
                That combination isn't available — try a different size/color.
              </div>
            )}

            {/* Stock indicator */}
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: product.stock > 0 ? "#22c55e" : "var(--danger)" }}
              />
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : "Out of stock"}
              </span>
            </div>

            {/* Add to cart */}
            <button
              disabled={product.stock === 0}
              onClick={() => {
                if (hasVariants && !selectedVariant) {
                  setVariantError(true);
                  return;
                }
                addItem({
                  id: product.id,
                  name: product.name,
                  price: displayPrice,
                  imageUrl: selectedVariant?.imageUrl || product.imageUrl,
                  category: product.category,
                  variantId: selectedVariant?.variantId,
                  size: selectedVariant?.size,
                  color: selectedVariant?.color,
                });
              }}
              className="fault-btn flex items-center justify-center gap-2 py-4 rounded-lg font-bold tracking-wider text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={18} />
              {product.stock === 0 ? "SOLD OUT" : "ADD TO CART"}
            </button>

            {/* Info badges */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Zap size={14} />, text: "Fast Shipping" },
                { icon: <Package size={14} />, text: "Premium Packaging" },
              ].map((b) => (
                <div
                  key={b.text}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}
                >
                  <span style={{ color: "var(--tx)" }}>{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
