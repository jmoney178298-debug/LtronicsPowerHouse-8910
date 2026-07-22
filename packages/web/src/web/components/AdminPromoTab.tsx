import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Tag, Check, X, AlertCircle } from "lucide-react";
import { authFetch } from "../lib/authFetch";

export function AdminPromoTab() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("");
  const [formErr, setFormErr] = useState("");

  const codes = useQuery({
    queryKey: ["admin-promo"],
    queryFn: async () => {
      const res = await authFetch("/api/promo");
      return res.json();
    },
  });

  const createCode = useMutation({
    mutationFn: async (data: { code: string; percentOff: number }) => {
      const res = await authFetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create code");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promo"] });
      setCode("");
      setPercentOff("");
      setFormErr("");
    },
    onError: (e: any) => setFormErr(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await authFetch(`/api/promo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-promo"] }),
  });

  const deleteCode = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/promo/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-promo"] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr("");
    const val = parseFloat(percentOff);
    if (!code.trim()) { setFormErr("Enter a code"); return; }
    if (isNaN(val) || val <= 0 || val > 100) { setFormErr("Percent off must be 1-100"); return; }
    createCode.mutate({ code: code.trim().toUpperCase(), percentOff: val });
  };

  const codeList = codes.data?.codes ?? [];

  return (
    <div>
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "rgba(232,96,10,0.06)", border: "1px solid rgba(232,96,10,0.25)" }}
      >
        <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--tx)" }}>
          Send Discount Codes To Customers
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Create a code, share it with a customer, they enter it at checkout. Set percentOff to 100
          for a completely free order (skips payment, order is marked paid instantly, still fulfills
          via Printful if applicable).
        </p>

        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. PHK50"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          <div className="w-32">
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>% Off</label>
            <input
              type="number" min="1" max="100"
              value={percentOff}
              onChange={(e) => setPercentOff(e.target.value)}
              placeholder="50"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          <button
            type="submit"
            disabled={createCode.isPending}
            className="fault-btn flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white text-sm disabled:opacity-60"
          >
            {createCode.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Code
          </button>
        </form>
        {formErr && (
          <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: "var(--danger)" }}>
            <AlertCircle size={11} /> {formErr}
          </div>
        )}
      </div>

      {codes.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: "var(--tx)" }} /></div>
      ) : codeList.length === 0 ? (
        <div className="py-16 text-center" style={{ color: "var(--muted)" }}>No promo codes yet</div>
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                {["Code", "Discount", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codeList.map((cd: any, i: number) => (
                <tr key={cd.id} style={{ background: i % 2 === 0 ? "var(--bg-alt)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 font-mono font-bold" style={{ color: "var(--brand-gold)" }}>
                      <Tag size={12} /> {cd.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: "var(--tx)" }}>
                    {cd.percentOff}% {cd.percentOff >= 100 ? "(FREE)" : "off"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive.mutate({ id: cd.id, active: !cd.active })}
                      className="flex items-center gap-1.5 text-xs font-bold"
                      style={{ color: cd.active ? "#22c55e" : "var(--muted)" }}
                    >
                      {cd.active ? <><Check size={12} /> Active</> : <><X size={12} /> Disabled</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => deleteCode.mutate(cd.id)} className="p-1.5 rounded" style={{ color: "var(--muted)" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
