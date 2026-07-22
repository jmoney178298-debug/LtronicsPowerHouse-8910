import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Edit2, Trash2, X, Check, Loader2, ImagePlus, AlertCircle, Link as LinkIcon,
} from "lucide-react";
import { authFetch } from "../lib/authFetch";

const CATEGORIES = ["Gear Guides", "Hustle Stories", "Tech Picks", "Style", "General"];

interface AffLink { label: string; url: string }

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: string;
  category: string;
  published: boolean;
  affiliateLinks: AffLink[];
}

const EMPTY_FORM: PostForm = {
  title: "", slug: "", excerpt: "", body: "", coverImage: "",
  category: "General", published: false, affiliateLinks: [],
};

function CoverUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setErr(null);
    try {
      const presignRes = await authFetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { url, publicUrl } = await presignRes.json();
      const putRes = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putRes.ok) throw new Error("Upload failed");
      onChange(publicUrl);
    } catch (e: any) {
      setErr(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted)" }}>
        Cover Image
      </label>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
      {value ? (
        <div className="relative w-full rounded-xl overflow-hidden" style={{ border: "1.5px solid var(--border)" }}>
          <img src={value} alt="Cover" className="w-full h-40 object-cover" />
          <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-2" style={{ background: "rgba(0,0,0,0.7)" }}>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold" style={{ background: "var(--tx)", color: "#000" }}>
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />} Change
            </button>
            <button type="button" onClick={() => onChange("")}
              className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm"
          style={{ background: "rgba(232,96,10,0.08)", border: "2px dashed rgba(232,96,10,0.5)", color: "var(--tx)" }}>
          {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : <><ImagePlus size={18} /> Add Cover Image</>}
        </button>
      )}
      {err && <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: "var(--danger)" }}><AlertCircle size={11} /> {err}</div>}
    </div>
  );
}

export function AdminBlogTab() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editPost, setEditPost] = useState<any | null>(null);
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const posts = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const res = await authFetch("/api/blog?all=true");
      return res.json();
    },
  });

  const createPost = useMutation({
    mutationFn: async (data: any) => {
      const res = await authFetch("/api/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-posts"] }); qc.invalidateQueries({ queryKey: ["blog-posts"] }); closeModal(); },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await authFetch(`/api/blog/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-posts"] }); qc.invalidateQueries({ queryKey: ["blog-posts"] }); closeModal(); },
  });

  const deletePost = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/blog/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-posts"] }); qc.invalidateQueries({ queryKey: ["blog-posts"] }); setDeleteId(null); },
  });

  const openCreate = () => { setEditPost(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (p: any) => {
    setEditPost(p);
    let links: AffLink[] = [];
    try { links = p.affiliateLinks ? JSON.parse(p.affiliateLinks) : []; } catch { links = []; }
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt, body: p.body,
      coverImage: p.coverImage, category: p.category, published: p.published,
      affiliateLinks: links,
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditPost(null); setForm(EMPTY_FORM); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form };
    if (editPost) updatePost.mutate({ id: editPost.id, data });
    else createPost.mutate(data);
  };

  const addLink = () => setForm({ ...form, affiliateLinks: [...form.affiliateLinks, { label: "", url: "" }] });
  const updateLink = (i: number, key: keyof AffLink, value: string) => {
    const links = [...form.affiliateLinks];
    links[i] = { ...links[i], [key]: value };
    setForm({ ...form, affiliateLinks: links });
  };
  const removeLink = (i: number) => setForm({ ...form, affiliateLinks: form.affiliateLinks.filter((_, idx) => idx !== i) });

  const postList = posts.data?.posts ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <span className="text-sm" style={{ color: "var(--muted)" }}>{postList.length} posts</span>
        <button onClick={openCreate}
          className="fault-btn flex items-center gap-2 px-4 py-2 rounded font-bold text-white text-sm">
          <Plus size={14} /> New Post
        </button>
      </div>

      {posts.isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin" style={{ color: "var(--tx)" }} /></div>
      ) : postList.length === 0 ? (
        <div className="py-20 text-center" style={{ color: "var(--muted)" }}>No posts yet — write your first Kingz Talk post</div>
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                {["Title", "Category", "Status", "Affiliate Links", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {postList.map((p: any, i: number) => {
                let linkCount = 0;
                try { linkCount = p.affiliateLinks ? JSON.parse(p.affiliateLinks).length : 0; } catch { linkCount = 0; }
                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? "var(--bg-alt)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{p.title}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: "var(--tx-soft)", color: "var(--tx)" }}>{p.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.published ? (
                        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#22c55e" }}><Check size={12} /> Published</span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--co)" }}><LinkIcon size={11} /> {linkCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded" style={{ color: "var(--muted)" }}><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded" style={{ color: "var(--muted)" }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-xl rounded-2xl flex flex-col max-h-[92vh] overflow-y-auto" style={{ background: "var(--bg-alt)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-bold text-base">{editPost ? "Edit Post" : "New Kingz Talk Post"}</h2>
              <button onClick={closeModal} style={{ color: "var(--muted)" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              <CoverUploader value={form.coverImage} onChange={(url) => setForm({ ...form, coverImage: url })} />

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  placeholder="5 Chains That Actually Hit Different" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>Slug (auto from title if blank)</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  placeholder="5-chains-that-hit-different" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>Excerpt</label>
                <textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  placeholder="Short teaser shown on the blog list..." />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted)" }}>Body (Markdown supported) *</label>
                <textarea required rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-y font-mono" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  placeholder={"## Heading\n\nWrite your post here. **Bold**, lists, links all work."} />
              </div>

              {/* Affiliate links repeater */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--muted)" }}>Affiliate Links</label>
                  <button type="button" onClick={addLink} className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--co)" }}>
                    <Plus size={12} /> Add Link
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {form.affiliateLinks.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={link.label} onChange={(e) => updateLink(i, "label", e.target.value)} placeholder="Label (e.g. Get the chain)"
                        className="flex-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                      <input value={link.url} onChange={(e) => updateLink(i, "url", e.target.value)} placeholder="https://..."
                        className="flex-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                      <button type="button" onClick={() => removeLink(i)} className="px-2 rounded" style={{ color: "var(--danger)" }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-5 rounded-full relative transition-colors" style={{ background: form.published ? "var(--tx)" : "var(--border)" }}
                  onClick={() => setForm({ ...form, published: !form.published })}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full transition-transform bg-white" style={{ transform: form.published ? "translateX(21px)" : "translateX(2px)" }} />
                </div>
                <span className="text-sm">Published (visible on site)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-lg font-semibold text-sm" style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "transparent" }}>Cancel</button>
                <button type="submit" disabled={createPost.isPending || updatePost.isPending}
                  className="fault-btn flex-1 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60">
                  {(createPost.isPending || updatePost.isPending) ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (editPost ? "Save Changes" : "Publish Post")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--bg-alt)", border: "1px solid var(--border)" }}>
            <h2 className="font-bold text-base mb-2">Delete Post?</h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded font-semibold text-sm" style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>Cancel</button>
              <button onClick={() => deletePost.mutate(deleteId)} disabled={deletePost.isPending}
                className="flex-1 py-2.5 rounded font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: "var(--danger)" }}>
                {deletePost.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
