import { Link } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../lib/cart";

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  const cartTotal = total();

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-5">
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--tx)" }}>
            Your Items
          </div>
          <h1 className="font-display text-5xl">CART</h1>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <ShoppingBag size={64} style={{ color: "var(--border)" }} />
            <div className="font-display text-4xl" style={{ color: "var(--muted)" }}>EMPTY CART</div>
            <p style={{ color: "var(--muted)" }}>Nothing here yet. Start shopping, king.</p>
            <Link to="/shop">
              <span
                className="px-8 py-3 rounded font-bold text-white tracking-wider cursor-pointer"
                style={{ background: "var(--tx)" }}
              >
                SHOP NOW
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={item.lineId}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <Link to={`/product/${item.id}`}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                      style={{ border: "1px solid var(--border)" }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--co)" }}>
                      {item.category}
                    </div>
                    <Link to={`/product/${item.id}`}>
                      <h3
                        className="font-semibold text-sm mt-0.5 cursor-pointer transition-colors"
                        onMouseEnter={(e) => (e.currentTarget as HTMLHeadingElement).style.color = "var(--tx)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLHeadingElement).style.color = "var(--text)"}
                      >
                        {item.name}
                      </h3>
                    </Link>
                    {(item.size || item.color) && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {[item.color, item.size].filter(Boolean).join(" / ")}
                      </div>
                    )}
                    <div className="font-bold mt-1" style={{ color: "var(--tx)" }}>
                      ${item.price.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateQty(item.lineId, item.qty - 1)}
                        className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                        style={{ border: "1px solid var(--border)", color: "var(--text)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "var(--tx)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--tx)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-semibold text-sm w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.lineId, item.qty + 1)}
                        className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                        style={{ border: "1px solid var(--border)", color: "var(--text)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "var(--tx)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--tx)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
                        }}
                      >
                        <Plus size={12} />
                      </button>
                      <span className="text-xs ml-4" style={{ color: "var(--muted)" }}>
                        Subtotal: ${(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.lineId)}
                    className="self-start p-1.5 rounded transition-colors hover:text-red-400"
                    style={{ color: "var(--muted)" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button
                onClick={clearCart}
                className="self-start text-xs transition-colors hover:text-red-400 mt-2"
                style={{ color: "var(--muted)" }}
              >
                Clear cart
              </button>
            </div>

            {/* Summary */}
            <div
              className="h-fit rounded-xl p-6 flex flex-col gap-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <h2 className="font-bold text-base">Order Summary</h2>

              <div className="flex flex-col gap-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span style={{ color: "var(--muted)" }}>
                      {item.name} × {item.qty}
                    </span>
                    <span>${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div
                className="border-t pt-4 flex justify-between font-bold"
                style={{ borderColor: "var(--border)" }}
              >
                <span>Total</span>
                <span style={{ color: "var(--tx)" }}>${cartTotal.toFixed(2)}</span>
              </div>

              <Link to="/checkout">
                <span
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded font-bold text-white tracking-wider cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: "var(--tx)" }}
                >
                  CHECKOUT <ArrowRight size={16} />
                </span>
              </Link>

              <Link to="/shop">
                <span
                  className="block text-center text-xs cursor-pointer transition-colors"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLSpanElement).style.color = "var(--co)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLSpanElement).style.color = "var(--muted)"}
                >
                  ← Continue Shopping
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
