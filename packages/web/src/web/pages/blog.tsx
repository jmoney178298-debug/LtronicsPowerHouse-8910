import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, ArrowUpRight } from "lucide-react";
import { api } from "../lib/api";

const CATEGORIES = ["All", "Gear Guides", "Hustle Stories", "Tech Picks", "Style", "General"];

export default function BlogListPage() {
  const [category, setCategory] = useState("All");

  const posts = useQuery({
    queryKey: ["blog-posts", category],
    queryFn: async () => {
      const res = await api.blog.$get({ query: { category } });
      return res.json();
    },
  });

  const postList = posts.data?.posts ?? [];

  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-5">
        {/* Header */}
        <div className="mb-10 max-w-2xl">
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--tx)" }}>
            From The Crew
          </div>
          <h1 className="font-display text-6xl mb-4">KINGZ TALK</h1>
          <p className="text-base" style={{ color: "var(--muted)" }}>
            Gear breakdowns, hustle stories, and picks worth cosigning — some links below
            are affiliate links, which help keep the lights on at no extra cost to you.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all"
              style={{
                background: category === c ? "var(--tx)" : "var(--card)",
                color: category === c ? "#fff" : "var(--muted)",
                border: `1px solid ${category === c ? "var(--tx)" : "var(--border)"}`,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {posts.isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--tx)" }} />
          </div>
        ) : postList.length === 0 ? (
          <div className="py-24 text-center" style={{ color: "var(--muted)" }}>
            No posts yet — check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {postList.map((post: any) => (
              <Link key={post.id} to={`/kingz-talk/${post.slug}`}>
                <div
                  className="fault-card fault-card-gold group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300 h-full"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div style={{ height: 3, background: "linear-gradient(90deg, var(--tx) 0%, var(--brand-gold) 50%, var(--co) 100%)" }} />
                  {post.coverImage && (
                    <div className="relative overflow-hidden" style={{ paddingBottom: "56%" }}>
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-2 flex-1">
                    <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--co)" }}>
                      {post.category}
                    </div>
                    <h3 className="font-editorial font-bold text-lg leading-snug">{post.title}</h3>
                    <p className="text-xs line-clamp-2 flex-1" style={{ color: "var(--muted)" }}>
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-bold mt-2" style={{ color: "var(--tx)" }}>
                      Read more <ArrowUpRight size={12} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
