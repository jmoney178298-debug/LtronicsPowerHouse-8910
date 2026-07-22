import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, X, Wallet, Send } from "lucide-react";
import { authFetch } from "../lib/authFetch";

export function AdminRewardsTab() {
  const qc = useQueryClient();

  const accounts = useQuery({
    queryKey: ["admin-referral-accounts"],
    queryFn: async () => {
      const res = await authFetch("/api/referrals");
      return res.json();
    },
  });

  const cashouts = useQuery({
    queryKey: ["admin-cashouts"],
    queryFn: async () => {
      const res = await authFetch("/api/referrals/cashouts");
      return res.json();
    },
  });

  const updateCashout = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await authFetch(`/api/referrals/cashouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cashouts"] });
      qc.invalidateQueries({ queryKey: ["admin-referral-accounts"] });
    },
  });

  const accountList = accounts.data?.accounts ?? [];
  const cashoutList = cashouts.data?.requests ?? [];
  const pendingCashouts = cashoutList.filter((r: any) => r.status === "pending");
  const totalLiability = accountList.reduce((sum: number, a: any) => sum + a.storeCredit, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Referral Accounts", value: accountList.length },
          { label: "Store Credit Liability", value: `$${totalLiability.toFixed(2)}` },
          { label: "Pending Cashouts", value: pendingCashouts.length },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Send size={14} style={{ color: "var(--tx)" }} /> Pending Cashout Requests</h3>
        {cashouts.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{ color: "var(--tx)" }} /></div>
        ) : cashoutList.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: "var(--muted)" }}>No cashout requests</div>
        ) : (
          <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                  {["Referral ID", "Amount", "Method", "Destination", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashoutList.map((r: any, i: number) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "var(--bg-alt)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-[120px]">{r.referralId}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--tx)" }}>${r.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 capitalize">{r.method}</td>
                    <td className="px-4 py-3 text-xs">{r.destination}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          color: r.status === "paid" ? "#22c55e" : r.status === "rejected" ? "var(--danger)" : "var(--co)",
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => updateCashout.mutate({ id: r.id, status: "paid" })}
                            className="p-1.5 rounded flex items-center gap-1 text-xs font-bold"
                            style={{ color: "#22c55e" }}
                          >
                            <Check size={13} /> Mark Paid
                          </button>
                          <button
                            onClick={() => updateCashout.mutate({ id: r.id, status: "rejected" })}
                            className="p-1.5 rounded flex items-center gap-1 text-xs font-bold"
                            style={{ color: "var(--danger)" }}
                          >
                            <X size={13} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Wallet size={14} style={{ color: "var(--co)" }} /> All Referral Accounts</h3>
        {accounts.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{ color: "var(--tx)" }} /></div>
        ) : accountList.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: "var(--muted)" }}>No referral accounts yet</div>
        ) : (
          <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                  {["Referral ID", "Balance", "Shared?", "Newcomer Bonus?"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accountList.map((a: any, i: number) => (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? "var(--bg-alt)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-[160px]">{a.referralId}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--tx)" }}>${a.storeCredit.toFixed(2)}</td>
                    <td className="px-4 py-3">{a.shareClaimed ? <Check size={13} className="text-green-400" /> : <X size={13} style={{ color: "var(--border)" }} />}</td>
                    <td className="px-4 py-3">{a.newcomerClaimed ? <Check size={13} className="text-green-400" /> : <X size={13} style={{ color: "var(--border)" }} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
