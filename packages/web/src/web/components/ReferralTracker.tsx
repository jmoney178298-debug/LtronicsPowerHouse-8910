import { useEffect, useState } from "react";
import { getReferralId } from "../lib/referral";

/**
 * Mounted once at app root. Registers every visitor with an anonymous referral
 * account, and if they arrived via someone's share link (?ref=CODE), grants
 * the one-time $20 newcomer bonus and shows a welcome toast.
 */
export function ReferralTracker() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const myId = getReferralId();

    fetch("/api/referrals/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralId: myId }),
    }).catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode && refCode !== myId) {
      fetch("/api/referrals/track-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: refCode, newVisitorId: myId }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.rewarded) {
            setToast(`Welcome! You just got $${d.rewarded} in store credit for joining via a friend's link 🎉`);
            setTimeout(() => setToast(null), 8000);
          }
        })
        .catch(() => {});
    }
  }, []);

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl font-semibold text-sm text-center max-w-md shadow-lg"
      style={{
        background: "linear-gradient(115deg, var(--tx), var(--brand-gold), var(--co))",
        color: "#080608",
      }}
    >
      {toast}
    </div>
  );
}
