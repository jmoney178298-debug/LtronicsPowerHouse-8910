import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, Lock, ArrowLeft, Loader2, CreditCard, Tag, Check, X, Wallet } from "lucide-react";
import { useCart } from "../lib/cart";
import { getReferralId } from "../lib/referral";

export default function CheckoutPage() {
  const { items, total } = useCart();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percentOff: number } | null>(null);

  const [creditBalance, setCreditBalance] = useState(0);
  const [useCredit, setUseCredit] = useState(false);

  useEffect(() => {
    fetch(`/api/referrals/balance/${getReferralId()}`)
      .then((r) => r.json())
      .then((d) => setCreditBalance(d.account?.storeCredit ?? 0))
      .catch(() => {});
  }, []);

  const cartTotal = total();
  const discountAmount = appliedPromo ? cartTotal * (appliedPromo.percentOff / 100) : 0;
  const afterPromo = Math.max(0, cartTotal - discountAmount);
  const creditToUse = useCredit ? Math.min(creditBalance, afterPromo) : 0;
  const finalTotal = Math.max(0, afterPromo - creditToUse);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoChecking(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setPromoError(data.error || "Invalid code");
        setAppliedPromo(null);
        return;
      }
      setAppliedPromo({ code: data.code, percentOff: data.percentOff });
      setPromoError("");
    } catch {
      setPromoError("Something went wrong, try again");
    } finally {
      setPromoChecking(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            imageUrl: i.imageUrl,
            qty: i.qty,
            variantId: i.variantId,
            size: i.size,
            color: i.color,
          })),
          promoCode: appliedPromo?.code || undefined,
          useStoreCredit: creditToUse > 0 ? { referralId: getReferralId(), amount: creditToUse } : undefined,
          successUrl: `${window.location.origin}/order-success`,
          cancelUrl: `${window.location.origin}/cart`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create checkout session");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto mb-4" style={{ color: "var(--border)" }} />
          <div className="font-display text-3xl mb-2">CART IS EMPTY</div>
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
      <div className="max-w-5xl mx-auto px-5">
        <div className="mb-8">
          <Link to="/cart">
            <span
              className="flex items-center gap-1 text-sm cursor-pointer mb-4 transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLSpanElement).style.color = "#fff"}
              onMouseLeave={(e) => (e.currentTarget as HTMLSpanElement).style.color = "var(--muted)"}
            >
              <ArrowLeft size={14} /> Back to Cart
            </span>
          </Link>
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--tx)" }}>
            Secure Checkout
          </div>
          <h1 className="font-display text-5xl">CHECKOUT</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order summary */}
          <div
            className="rounded-xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <ShoppingBag size={16} style={{ color: "var(--tx)" }} />
              Order Summary
            </h2>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                    style={{ border: "1px solid var(--border)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>Qty: {item.qty}</div>
                  </div>
                  <div className="font-semibold text-sm" style={{ color: "var(--tx)" }}>
                    ${(item.price * item.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            {/* Promo code */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                <Tag size={12} /> Promo Code
              </label>
              {appliedPromo ? (
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)" }}
                >
                  <span className="flex items-center gap-2 text-sm font-bold" style={{ color: "#22c55e" }}>
                    <Check size={14} /> {appliedPromo.code} — {appliedPromo.percentOff}% off
                  </span>
                  <button onClick={removePromo} style={{ color: "var(--muted)" }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyPromo(); } }}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoChecking || !promoInput.trim()}
                    className="px-4 py-2.5 rounded-lg font-bold text-xs disabled:opacity-50"
                    style={{ border: "1px solid var(--co)", color: "var(--co)" }}
                  >
                    {promoChecking ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
              {promoError && (
                <div className="text-xs mt-1.5" style={{ color: "var(--danger)" }}>{promoError}</div>
              )}
            </div>

            {/* Store credit */}
            {creditBalance > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    <Wallet size={12} /> Use Store Credit (${creditBalance.toFixed(2)} available)
                  </span>
                  <div
                    className="w-10 h-5 rounded-full relative transition-colors"
                    style={{ background: useCredit ? "var(--co)" : "var(--border)" }}
                    onClick={() => setUseCredit(!useCredit)}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full transition-transform bg-white"
                      style={{ transform: useCredit ? "translateX(21px)" : "translateX(2px)" }}
                    />
                  </div>
                </label>
              </div>
            )}

            <div className="mt-4 pt-4 border-t flex flex-col gap-1.5" style={{ borderColor: "var(--border)" }}>
              {(appliedPromo || creditToUse > 0) && (
                <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              )}
              {appliedPromo && (
                <div className="flex justify-between text-sm" style={{ color: "#22c55e" }}>
                  <span>Discount ({appliedPromo.percentOff}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {creditToUse > 0 && (
                <div className="flex justify-between text-sm" style={{ color: "var(--co)" }}>
                  <span>Store Credit</span>
                  <span>-${creditToUse.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span style={{ color: "var(--tx)" }}>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment section */}
          <div
            className="rounded-xl p-6 flex flex-col gap-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div>
              <h2 className="font-bold mb-2 flex items-center gap-2">
                <Lock size={16} style={{ color: "var(--co)" }} />
                Secure Checkout
              </h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                You'll be redirected to our secure payment page. Pay with whatever you have.
              </p>
            </div>

            {/* Accepted payment methods */}
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--bg)", border: "1px solid rgba(0,170,255,0.15)" }}
            >
              <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--co)" }}>
                We Accept
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "💳 Credit / Debit Cards", sub: "Visa, Mastercard, Amex" },
                  { label: "🎁 Gift Cards", sub: "Visa & Mastercard gift cards" },
                  { label: "💚 Cash App Pay", sub: "Pay with your $Cashtag" },
                  { label: "🍎 Apple Pay", sub: "One-tap checkout" },
                  { label: "🔵 Google Pay", sub: "Fast & secure" },
                  { label: "💳 Prepaid Cards", sub: "All major prepaid cards" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-lg p-2.5"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <div className="text-xs font-semibold">{m.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg p-3 text-sm flex items-center gap-2"
              style={{ background: "rgba(0,170,255,0.05)", border: "1px solid rgba(0,170,255,0.2)" }}
            >
              <Lock size={12} style={{ color: "var(--co)" }} />
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                256-bit SSL encrypted · Powered by Square
              </span>
            </div>

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-4 rounded-lg font-bold text-white tracking-wider transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--tx)" }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Setting up payment...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  {finalTotal <= 0 ? "GET IT FREE" : `PAY ${finalTotal.toFixed(2)} SECURELY`}
                </>
              )}
            </button>

            {/* CashApp direct payment */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-xs" style={{ color: "var(--muted)" }}>or pay direct</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            <a
              href={`https://cash.app/$PowerHouseKingzCo/${finalTotal.toFixed(2)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3.5 rounded-lg font-bold tracking-wider transition-all hover:opacity-90"
              style={{
                background: "rgba(0,212,80,0.1)",
                border: "1.5px solid rgba(0,212,80,0.4)",
                color: "#00d450",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm2.4 6.6l-.6 2.1c.9.3 1.8.7 2.4 1.3l-1.5 1.5c-.5-.5-1.1-.8-1.8-1l-.9 3.3c1.7.5 3.6 1.2 3.6 3.3 0 1.8-1.3 3-3 3.3l-.3 1.2H10.8l.3-1.3c-1-.3-2-.8-2.7-1.5l1.5-1.5c.5.5 1.2.9 2 1.1l.9-3.4c-1.7-.5-3.5-1.2-3.5-3.2 0-1.7 1.2-2.9 2.9-3.2l.3-1.2H13.8l-.3 1.2h.9z"/>
              </svg>
              PAY $PowerHouseKingzCo VIA CASHAPP
            </a>
            <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
              Send <strong style={{ color: "#00d450" }}>${cartTotal.toFixed(2)}</strong> to <strong>$PowerHouseKingzCo</strong> — include your order details in the note
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
