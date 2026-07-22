import { ShoppingCart, Star } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "../lib/cart";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  featured: boolean;
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
    });
  };

  return (
    <Link to={`/product/${product.id}`}>
      <div
        className="group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300 fault-card fault-card-gold"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,96,10,0.4)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 0 24px rgba(232,96,10,0.12), 0 8px 32px rgba(0,0,0,0.6)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Seam accent */}
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--tx) 0%, var(--brand-gold) 50%, var(--co) 100%)" }} />

        {/* Image */}
        <div className="relative overflow-hidden" style={{ paddingBottom: "75%" }}>
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&q=70"}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.featured && (
            <div
              className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
              style={{ background: "var(--tx)", color: "#fff" }}
            >
              <Star size={8} fill="#fff" /> FEATURED
            </div>
          )}
          {product.stock === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(5,5,9,0.7)" }}
            >
              <span className="text-sm font-bold" style={{ color: "var(--muted)" }}>SOLD OUT</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <div
            className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: "var(--co)" }}
          >
            {product.category}
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{product.name}</h3>
          <p className="text-xs line-clamp-2 flex-1" style={{ color: "var(--muted)" }}>
            {product.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-base" style={{ color: "var(--tx)" }}>
              ${product.price.toFixed(2)}
            </span>
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="fault-btn flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={12} />
              ADD
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
