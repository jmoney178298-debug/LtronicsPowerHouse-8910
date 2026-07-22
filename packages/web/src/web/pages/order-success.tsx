import { useEffect } from "react";
import { useSearch, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";
import { useCart } from "../lib/cart";

export default function OrderSuccessPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  // Square returns checkoutId or transactionId; fallback to session_id for legacy
  const sessionId = params.get("checkoutId") || params.get("transactionId") || params.get("session_id");
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, []);

  const order = useQuery({
    queryKey: ["order-success", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await fetch(`/api/orders/by-session/${sessionId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!sessionId,
    retry: 3,
    retryDelay: 1500,
  });

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
      <div className="max-w-lg w-full mx-auto px-5 text-center">
        {/* Success icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
        >
          <CheckCircle size={40} className="text-green-400" />
        </div>

        <h1 className="font-display text-5xl mb-3" style={{ color: "var(--tx)" }}>
          ORDER PLACED!
        </h1>
        <p className="mb-8" style={{ color: "var(--muted)" }}>
          Your order has been confirmed. You'll receive an email confirmation shortly.
        </p>

        {/* Order details */}
        {order.isLoading && (
          <div className="flex items-center justify-center gap-2 mb-8" style={{ color: "var(--muted)" }}>
            <Loader2 size={16} className="animate-spin" style={{ color: "var(--tx)" }} />
            <span className="text-sm">Loading order details...</span>
          </div>
        )}

        {order.data?.order && (
          <div
            className="rounded-xl p-6 mb-8 text-left"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} style={{ color: "var(--tx)" }} />
              <span className="font-bold">Order #{order.data.order.id}</span>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {(order.data.order.items ?? []).map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>
                    {item.productName} × {item.qty}
                  </span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div
              className="border-t pt-4 flex justify-between font-bold"
              style={{ borderColor: "var(--border)" }}
            >
              <span>Total Paid</span>
              <span style={{ color: "var(--tx)" }}>${order.data.order.total?.toFixed(2)}</span>
            </div>

            {order.data.order.shippingAddress && (
              <div className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
                Ships to: {order.data.order.shippingAddress}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/shop">
            <span
              className="flex items-center justify-center gap-2 px-6 py-3 rounded font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "var(--tx)" }}
            >
              KEEP SHOPPING <ArrowRight size={16} />
            </span>
          </Link>
          <Link to="/">
            <span
              className="flex items-center justify-center gap-2 px-6 py-3 rounded font-semibold text-sm cursor-pointer transition-colors"
              style={{ border: "1px solid var(--co)", color: "var(--co)", background: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLSpanElement).style.background = "rgba(0,170,255,0.08)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLSpanElement).style.background = "transparent"}
            >
              Back to Home
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
