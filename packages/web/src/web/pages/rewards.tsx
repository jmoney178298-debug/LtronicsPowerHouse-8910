import { useState, useEffect } from "react";
import { Gift, Copy, Check, Loader2, Wallet, Send, AlertCircle } from "lucide-react";
import { getReferralId, getShareLink } from "../lib/referral";

export default function RewardsPage() {
  const [balance, setBalance] = useState(0);
  const [shareClaimed, setShareClaimed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [method, setMethod] = useState<"cashapp" | "bank">("cashapp");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [cashoutMsg, setCashoutMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [cashoutSubmitting, setCashoutSubmitting] = useState(false);

  const referralId = getReferralId();
  const shareLink = getShareLink();

  const refresh = () => {
    fetch(`/api/referrals/balance/${referralId}`)
      .then((r) => r.json())
      .then((d) => {
        setBalance(d.account?.storeCredit ?? 0);
        setShareClaimed(d.account?.shareClaimed ?? false);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/referrals/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralId }),
    }).finally(refresh);
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    setClaimMsg(null);
    try {
      const res = await fetch("/api/referrals/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimMsg({ text: data.error || "Could not claim reward", ok: false });
        return;
      }
      setBalance(data.account.storeCredit);
      setShareClaimed(true);
      setClaimMsg({ text: `$${data.rewarded} added to your store credit!`, ok: true });
    } catch {
      setClaimMsg({ text: "Something went wrong", ok: false });
    } finally {
      setClaiming(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCashoutMsg(null);
    const amt = parseFloat(amount);
    if (!destination.trim() || isNaN(amt) || amt <= 0) {
      setCashoutMsg({ text: "Enter a valid amount and destination", ok: false });
      return;
    }
    if (amt > balance) {
      setCashoutMsg({ text: "Amount exceeds your available balance", ok: false });
      return;
    }
    setCashoutSubmitting(true);
    try {
      const res = await fetch("/api/referrals/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralId, method, destination, amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCashoutMsg({ text: data.error || "Failed to submit request", ok: false });
        return;
      }
      setBalance((b) => b - amt);
      setDestination("");
      setAmount("");
      setCashoutMsg({ text: "Cashout request submitted — we'll send your payout shortly.", ok: true });
    } catch {
      setCashoutMsg({ text: "Something went wrong", ok: false });
    } finally {
      setCashoutSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="max-w-3xl mx-auto px-5">
        <div className="mb-10">
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--tx)" }}>
            Refer & Earn
          </div>
          <h1 className="font-display text-6xl mb-4">GET PAID TO PUT KINGZ ON.</h1>
          <p className="text-base max-w-xl" style={{ color: "var(--muted)" }}>
            Share your link, earn <strong style={{ color: "var(--tx)" }}>$50</strong> instantly.
            Anyone who lands on the site through your link gets{" "}
            <strong style={{ color: "var(--co)" }}>$20</strong> in store credit too, on us.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: "var(--tx)" }} /></div>
        ) : (
          <>
            {/* Balance */}
            <div
              className="fault-card fault-card-gold rounded-xl p-6 mb-6 flex items-center justify-between flex-wrap gap-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div>
                <div className="text-xs font-semibold tracking-widest uppercase mb-1 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                  <Wallet size={12} /> Your Store Credit
                </div>
                <div className="font-display text-4xl" style={{ color: "var(--tx)" }}>${balance.toFixed(2)}</div>
              </div>
              <div className="text-xs max-w-xs" style={{ color: "var(--muted)" }}>
                Auto-applies at checkout, or request a cashout below.
              </div>
            </div>

            {/* Share & claim */}
            <div className="rounded-xl p-6 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="font-bold mb-1 flex items-center gap-2"><Gift size={16} style={{ color: "var(--tx)" }} /> Your Share Link</h2>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Copy it, post it, send it — first claim earns you $50.</p>

              <div className="flex gap-2 mb-4">
                <input
                  readOnly
                  value={shareLink}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none font-mono"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5"
                  style={{ border: "1px solid var(--co)", color: "var(--co)" }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <button
                onClick={handleClaim}
                disabled={claiming || shareClaimed}
                className="fault-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-bold text-white disabled:opacity-50"
              >
                {claiming ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
                {shareClaimed ? "Already Claimed" : "Claim My $50"}
              </button>

              {claimMsg && (
                <div className="flex items-center gap-1.5 mt-3 text-sm" style={{ color: claimMsg.ok ? "#22c55e" : "var(--danger)" }}>
                  {claimMsg.ok ? <Check size={13} /> : <AlertCircle size={13} />} {claimMsg.text}
                </div>
              )}
            </div>

            {/* Cashout */}
            <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="font-bold mb-1 flex items-center gap-2"><Send size={16} style={{ color: "var(--co)" }} /> Request Cashout</h2>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                Send store credit to your CashApp or bank — we review and send it manually, usually within a couple days.
              </p>

              <form onSubmit={handleCashout} className="flex flex-col gap-3">
                <div className="flex gap-2">
                  {(["cashapp", "bank"] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setMethod(m)}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold capitalize"
                      style={{
                        background: method === m ? "var(--tx)" : "var(--bg)",
                        color: method === m ? "#fff" : "var(--muted)",
                        border: `1px solid ${method === m ? "var(--tx)" : "var(--border)"}`,
                      }}
                    >
                      {m === "cashapp" ? "CashApp" : "Bank Transfer"}
                    </button>
                  ))}
                </div>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={method === "cashapp" ? "$YourCashtag" : "Account/routing info or IBAN"}
                  className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <input
                  type="number" min="1" step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Amount (max $${balance.toFixed(2)})`}
                  className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <button
                  type="submit"
                  disabled={cashoutSubmitting || balance <= 0}
                  className="flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm disabled:opacity-50"
                  style={{ border: "1px solid var(--co)", color: "var(--co)" }}
                >
                  {cashoutSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Request Cashout"}
                </button>
              </form>

              {cashoutMsg && (
                <div className="flex items-center gap-1.5 mt-3 text-sm" style={{ color: cashoutMsg.ok ? "#22c55e" : "var(--danger)" }}>
                  {cashoutMsg.ok ? <Check size={13} /> : <AlertCircle size={13} />} {cashoutMsg.text}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
