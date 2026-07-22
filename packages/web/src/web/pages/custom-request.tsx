import { useState, useRef } from "react";
import { Sparkles, ImagePlus, Loader2, Check, AlertCircle, X } from "lucide-react";

export default function CustomRequestPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [referenceImage, setReferenceImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const presignRes = await fetch("/api/upload/customer-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { url, publicUrl } = await presignRes.json();
      const putRes = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putRes.ok) throw new Error("Upload failed");
      setReferenceImage(publicUrl);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !description.trim()) {
      setError("Name, email, and description are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, description, referenceImage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit request");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-28 pb-24 flex items-center justify-center">
        <div className="max-w-lg w-full mx-auto px-5 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
          >
            <Check size={40} className="text-green-400" />
          </div>
          <h1 className="font-display text-5xl mb-3" style={{ color: "var(--tx)" }}>REQUEST SENT</h1>
          <p style={{ color: "var(--muted)" }}>
            We got your custom order request. We'll review it and send you a payment link with your
            price once it's quoted — check your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="max-w-2xl mx-auto px-5">
        <div className="mb-8 max-w-xl">
          <div className="text-xs font-semibold tracking-widest uppercase mb-2 flex items-center gap-1.5" style={{ color: "var(--tx)" }}>
            <Sparkles size={12} /> One Of One
          </div>
          <h1 className="font-display text-6xl mb-4">CUSTOM ORDERS</h1>
          <p className="text-base" style={{ color: "var(--muted)" }}>
            Want something built specifically for you — custom colorway, your own design, a one-off
            piece? Tell us what you're picturing and we'll send back a real price and payment link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl p-6 flex flex-col gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>Name *</label>
              <input required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>Email *</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>Phone (optional)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>What do you want made? *</label>
            <textarea required rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item, colors, sizing, any design details..."
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted)" }}>Reference Image (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
            {referenceImage ? (
              <div className="relative w-full rounded-xl overflow-hidden" style={{ border: "1.5px solid var(--border)" }}>
                <img src={referenceImage} alt="Reference" className="w-full h-40 object-cover" />
                <button type="button" onClick={() => setReferenceImage("")}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm"
                style={{ background: "rgba(232,96,10,0.08)", border: "2px dashed rgba(232,96,10,0.5)", color: "var(--tx)" }}>
                {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : <><ImagePlus size={18} /> Add Reference Image</>}
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--danger)" }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="fault-btn flex items-center justify-center gap-2 py-4 rounded-lg font-bold text-white tracking-wider disabled:opacity-60">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : "Send Custom Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
