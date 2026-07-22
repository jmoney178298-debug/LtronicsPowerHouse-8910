import { X, Trash2, ShoppingBag, Plus, Minus } from "lucide-react";
import { useCart } from "../lib/cart";
import { useLocation } from "wouter";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, total } = useCart();
  const [, navigate] = useLocation();

  if (!isOpen) return null;

  const cartTotal = total();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 animate-fade-in"
        style={{ background: "rgba(0,0,0,0.75)" }}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col animate-slide-in"
        style={{
          background: "var(--bg-alt)",
          borderLeft: "1px solid rgba(232,96,10,0.25)",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.8)",
        }}
      >
        {/* CO line on top */}
        <div style={{ height: 2, background: "linear-gradient(90deg, var(--tx) 0%, var(--co) 100%)" }} />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} style={{ color: "var(--tx)" }} />
            <span className="font-semibold">
              Cart{" "}
              <span style={{ color: "var(--muted)" }} className="text-sm font-normal">
                ({items.length})
              </span>
            </span>
          </div>
          <button onClick={closeCart} className="p-1" style={{ color: "var(--muted)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <ShoppingBag size={48} style={{ color: "var(--border-bright)" }} />
              <p style={{ color: "var(--muted)" }}>Cart is empty, king.</p>
              <button
                onClick={() => { closeCart(); navigate("/shop"); }}
                className="px-6 py-2 rounded text-sm font-semibold text-white"
                style={{ background: "var(--tx)" }}
              >
                Shop Now
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg p-3"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                  style={{ border: "1px solid var(--border-bright)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {item.category}
                    {(item.size || item.color) && (
                      <span> · {[item.color, item.size].filter(Boolean).join(" / ")}</span>
                    )}
                  </p>
                  <p className="text-sm font-bold mt-1" style={{ color: "var(--tx)" }}>
                    ${item.price.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.lineId, item.qty - 1)}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ background: "var(--border-bright)", color: "var(--text)" }}
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.lineId, item.qty + 1)}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ background: "var(--border-bright)", color: "var(--text)" }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.lineId)}
                  className="p-1 self-start"
                  style={{ color: "var(--danger)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="px-6 py-4 border-t flex flex-col gap-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--muted)" }}>Subtotal</span>
              <span className="font-bold text-base" style={{ color: "var(--tx)" }}>
                ${cartTotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => { closeCart(); navigate("/checkout"); }}
              className="w-full py-3 rounded font-bold text-white tracking-wider transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--tx) 0%, #c05008 100%)" }}
            >
              CHECKOUT
            </button>
            <button
              onClick={() => { closeCart(); navigate("/cart"); }}
              className="w-full py-2.5 rounded font-semibold text-sm transition-colors hover:border-blue-400"
              style={{
                border: "1px solid var(--border-bright)",
                color: "var(--co)",
                background: "transparent",
              }}
            >
              View Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
