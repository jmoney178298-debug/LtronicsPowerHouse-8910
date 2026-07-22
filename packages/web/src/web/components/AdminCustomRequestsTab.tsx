import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ExternalLink, Send, Check, X, ImageIcon } from "lucide-react";
import { authFetch } from "../lib/authFetch";

export function AdminCustomRequestsTab() {
  const qc = useQueryClient();
  const [quoteFor, setQuoteFor] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [quoteErr, setQuoteErr] = useState("");

  const requests = useQuery({
    queryKey: ["admin-custom-requests"],
    queryFn: async () => {
      const res = await authFetch("/api/custom-requests");
      return res.json();
    },
  });

  const sendQuote = useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      const res = await authFetch(`/api/custom-requests/${id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create quote");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-custom-requests"] });
      setQuoteFor(null);
      setAmount("");
      setQuoteErr("");
    },
    onError: (e: any) => setQuoteErr(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await authFetch(`/api/custom-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-custom-requests"] }),
  });

  const list = requests.data?.requests ?? [];

  const statusColor: Record<string, string> = {
    new: "var(--co)",
    quoted: "var(--brand-gold)",
    paid: "#22c55e",
    closed: "var(--muted)",
  };

  return (
    <div>
      {requests.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: "var(--tx)" }} /></div>
      ) : list.length === 0 ? (
        <div className="py-16 text-center" style={{ color: "var(--muted)" }}>No custom requests yet</div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((r: any) => (
            <div key={r.id} className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{r.name}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{r.email}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{ background: "rgba(255,255,255,0.06)", color: statusColor[r.status] || "var(--muted)" }}
                    >
                      {r.status}
                    </span>
                  </div>
                  {r.phone && <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>{r.phone}</div>}
                  <p className="text-sm" style={{ color: "var(--text)" }}>{r.description}</p>
                  {r.referenceImage && (
                    <a href={r.referenceImage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs mt-2 font-bold" style={{ color: "var(--co)" }}>
                      <ImageIcon size={12} /> View reference image
                    </a>
                  )}
                  {r.paymentLinkUrl && (
                    <a href={r.paymentLinkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs mt-2 font-bold" style={{ color: "var(--tx)" }}>
                      <ExternalLink size={12} /> Payment link (${r.quotedAmount}) — {r.paymentLinkUrl}
                    </a>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {r.status === "new" && (
                    quoteFor?.id === r.id ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-2">
                          <input
                            type="number" min="1" step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount"
                            className="w-28 px-2.5 py-2 rounded-lg text-sm outline-none"
                            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                          />
                          <button
                            onClick={() => sendQuote.mutate({ id: r.id, amount: parseFloat(amount) })}
                            disabled={sendQuote.isPending}
                            className="fault-btn px-3 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                          >
                            {sendQuote.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Send
                          </button>
                        </div>
                        {quoteErr && <span className="text-xs" style={{ color: "var(--danger)" }}>{quoteErr}</span>}
                      </div>
                    ) : (
                      <button
                        onClick={() => setQuoteFor(r)}
                        className="px-4 py-2 rounded-lg text-xs font-bold"
                        style={{ border: "1px solid var(--tx)", color: "var(--tx)" }}
                      >
                        Send Quote
                      </button>
                    )
                  )}
                  {r.status !== "closed" && (
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, status: "closed" })}
                      className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1"
                      style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
                    >
                      <X size={12} /> Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
