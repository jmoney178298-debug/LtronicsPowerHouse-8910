import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Loader2, ExternalLink, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";

export default function BlogPostPage() {
  const { slug } = useParams();

  const post = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const res = await api.blog[":slug"].$get({ param: { slug: slug! } });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (post.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--tx)" }} />
      </div>
    );
  }

  if (post.isError || !post.data?.post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 gap-4">
        <p style={{ color: "var(--muted)" }}>Post not found.</p>
        <Link to="/kingz-talk">
          <span className="text-sm font-bold" style={{ color: "var(--tx)" }}>← Back to Kingz Talk</span>
        </Link>
      </div>
    );
  }

  const p = post.data.post;
  let links: { label: string; url: string }[] = [];
  try {
    links = p.affiliateLinks ? JSON.parse(p.affiliateLinks) : [];
  } catch {
    links = [];
  }

  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="max-w-3xl mx-auto px-5">
        <Link to="/kingz-talk">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold mb-6 cursor-pointer" style={{ color: "var(--co)" }}>
            <ArrowLeft size={12} /> Back to Kingz Talk
          </span>
        </Link>

        <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--tx)" }}>
          {p.category}
        </div>

        <h1 className="font-editorial font-bold text-4xl sm:text-5xl leading-tight mb-4">{p.title}</h1>

        <div style={{ height: 3, width: 96, background: "linear-gradient(90deg, var(--tx), var(--brand-gold), var(--co))", marginBottom: 32, borderRadius: 2 }} />

        {p.coverImage && (
          <div className="rounded-xl overflow-hidden mb-8" style={{ border: "1px solid var(--border)" }}>
            <img src={p.coverImage} alt={p.title} className="w-full object-cover" style={{ maxHeight: 420 }} />
          </div>
        )}

        <div className="prose-content text-base leading-relaxed" style={{ color: "var(--text)" }}>
          <ReactMarkdown
            components={{
              p: (props) => <p className="mb-4" style={{ color: "var(--text)" }} {...props} />,
              h2: (props) => <h2 className="font-display text-2xl mt-8 mb-3" style={{ color: "var(--tx)" }} {...props} />,
              h3: (props) => <h3 className="font-bold text-lg mt-6 mb-2" {...props} />,
              a: (props) => <a className="underline" style={{ color: "var(--co)" }} target="_blank" rel="noopener noreferrer" {...props} />,
              ul: (props) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
              strong: (props) => <strong style={{ color: "var(--brand-gold)" }} {...props} />,
            }}
          >
            {p.body}
          </ReactMarkdown>
        </div>

        {/* Affiliate link cards */}
        {links.length > 0 && (
          <div className="mt-12">
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--co)" }}>
              Cosigned Picks
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="fault-card flex items-center justify-between gap-3 px-5 py-4 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(115deg, rgba(232,96,10,0.12), rgba(201,146,42,0.14) 60%, rgba(0,170,255,0.1))",
                    border: "1px solid var(--border-bright)",
                    color: "var(--text)",
                  }}
                >
                  {link.label}
                  <ExternalLink size={14} style={{ color: "var(--brand-gold)" }} />
                </a>
              ))}
            </div>
            <p className="text-[11px] mt-4" style={{ color: "var(--muted)" }}>
              Some links above are affiliate links — we may earn a commission at no extra cost to you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
