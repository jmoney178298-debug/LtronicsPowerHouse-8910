import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronRight, Zap, Shield, Truck, Star } from "lucide-react";
import { api } from "../lib/api";
import { ProductCard } from "../components/ProductCard";

const CATEGORIES = [
  { name: "T-Shirts", icon: "👕", description: "Premium tees for kings" },
  { name: "Hoodies", icon: "🧥", description: "Oversized luxury fleece" },
  { name: "Hats", icon: "🧢", description: "Crown your look" },
  { name: "Phones / Electronics", icon: "📱", description: "Powered up tech" },
  { name: "Speakers / Headphones", icon: "🔊", description: "BassKingz audio" },
  { name: "Backpacks", icon: "🎒", description: "Carry the kingdom" },
  { name: "Accessories", icon: "⛓️", description: "Gold finishing touch" },
  { name: "Cables & Chargers", icon: "⚡", description: "Stay powered" },
  { name: "Stickers", icon: "🏆", description: "Mark your territory" },
];

export default function HomePage() {
  const featured = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const res = await api.products.$get({ query: { featured: "true" } });
      return res.json();
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at 60% 40%, #1a0800 0%, #080608 60%)",
        }}
      >
        {/* Brand banner watermark */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/brand-banner.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.16,
            mixBlendMode: "screen",
          }}
        />

        {/* TX orange glow */}
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(232,96,10,0.1) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* CO blue glow */}
        <div
          className="absolute -bottom-20 left-10 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,170,255,0.07) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="max-w-6xl mx-auto px-5 pt-24 pb-16 relative z-10 w-full">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-widest"
              style={{
                background: "var(--tx-soft)",
                border: "1px solid rgba(232,96,10,0.35)",
                color: "var(--tx)",
              }}
            >
              <Zap size={10} fill="currentColor" />
              NEW DROPS LIVE NOW
            </div>

            <h1 className="font-display text-[clamp(4rem,12vw,9rem)] leading-none mb-6 animate-fade-up">
              <span
                style={{
                  backgroundImage: "url('/textures/street-texture_1783410691822.png')",
                  backgroundSize: "300px 300px",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  filter: "brightness(2.4) saturate(1.6)",
                }}
              >
                BORN STREET.
              </span>
              <br />
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, rgba(201,146,42,0.95), rgba(0,170,255,0.85)), url('/textures/marble-texture_1783410691822.png')",
                  backgroundSize: "cover, 300px 300px",
                  backgroundPosition: "0% 0%, 30% 40%",
                  backgroundBlendMode: "overlay",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  filter: "brightness(1.5) saturate(1.5)",
                }}
              >
                CROWNED KINGZ.
              </span>
            </h1>

            <p
              className="text-lg mb-8 max-w-xl animate-fade-up"
              style={{ color: "var(--muted)", animationDelay: "0.1s" }}
            >
              Premium clothing and electronics. Royal aesthetic meets street hustle.
              Gear for those who move with purpose — from the concrete to the crown.
            </p>

            <div
              className="flex flex-wrap gap-4 animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Link to="/shop">
                <span
                  className="fault-btn inline-flex items-center gap-2 px-8 py-3.5 rounded font-bold text-white tracking-wider transition-all hover:scale-105 cursor-pointer"
                >
                  SHOP NOW <ChevronRight size={16} />
                </span>
              </Link>
              <Link to="/shop?category=Phones / Electronics">
                <span
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded font-bold tracking-wider cursor-pointer transition-all"
                  style={{
                    border: "1px solid var(--co)",
                    color: "var(--co)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLSpanElement).style.background = "rgba(0,170,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLSpanElement).style.background = "transparent";
                  }}
                >
                  ELECTRONICS
                </span>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-16 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              {[
                { value: "500+", label: "Products" },
                { value: "10K+", label: "Orders Shipped" },
                { value: "4.9★", label: "Rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-3xl" style={{ color: "var(--tx)" }}>
                    {stat.value}
                  </div>
                  <div className="text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative side text */}
        <div
          className="absolute right-8 top-1/2 -translate-y-1/2 font-display text-[8rem] leading-none pointer-events-none hidden lg:block select-none"
          style={{ color: "rgba(232,96,10,0.04)", transform: "translateY(-50%) rotate(90deg)" }}
        >
          POWERED BY HUSTLE
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--tx)" }}>
              Featured Drops
            </div>
            <h2 className="font-display text-5xl">TOP PICKS</h2>
          </div>
          <Link to="/shop">
            <span
              className="flex items-center gap-1 text-sm font-semibold cursor-pointer transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLSpanElement).style.color = "var(--co)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLSpanElement).style.color = "var(--muted)"}
            >
              View all <ChevronRight size={14} />
            </span>
          </Link>
        </div>

        {featured.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{ background: "var(--card)", height: 280 }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
            {(featured.data?.products ?? []).slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section
        className="py-20"
        style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-10">
            <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--co)" }}>
              Browse by Category
            </div>
            <h2 className="font-display text-5xl">ALL CATEGORIES</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 stagger-children">
            {CATEGORIES.map((cat) => (
              <Link key={cat.name} to={`/shop?category=${encodeURIComponent(cat.name)}`}>
                <div
                  className="group p-4 rounded-xl cursor-pointer transition-all duration-200"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,170,255,0.35)";
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(0,170,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLDivElement).style.background = "var(--card)";
                  }}
                >
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className="font-semibold text-sm">{cat.name}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    {cat.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Shield size={24} />, title: "Premium Quality", desc: "Every product vetted for kings" },
            { icon: <Truck size={24} />, title: "Fast Shipping", desc: "Ships within 1-2 business days" },
            { icon: <Star size={24} />, title: "4.9★ Rated", desc: "Thousands of satisfied customers" },
          ].map((badge) => (
            <div
              key={badge.title}
              className="flex items-center gap-4 p-5 rounded-xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--tx-soft)", color: "var(--tx)" }}
              >
                {badge.icon}
              </div>
              <div>
                <div className="font-bold text-sm">{badge.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Stats */}
      <section style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { stat: "10K+", label: "Orders Shipped", desc: "A community built on loyalty and hustle." },
              { stat: "4.9★", label: "Average Rating", desc: "Quality that speaks for itself." },
              { stat: "500+", label: "Products", desc: "Apparel, electronics, accessories & more." },
            ].map((item) => (
              <div
                key={item.stat}
                className="p-6 rounded-xl"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="text-3xl font-display mb-1" style={{ color: "var(--tx)" }}>{item.stat}</div>
                <div className="font-bold text-sm mb-1">{item.label}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--co)" }}>
            Our Story
          </div>
          <h2 className="font-display text-4xl md:text-5xl mb-6">LEGACY IN MOTION</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
            <strong style={{ color: "var(--text)" }}>Born from culture. Built for legacy.</strong>
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
            PowerHouse Kingz Co × Ltronics PowerHouse represent the ones who hustle with intention.
            Founded by <strong style={{ color: "var(--text)" }}>Javier</strong> — a creative director and entrepreneur with 7+ years across branding, customer service, and business operations — our mission is simple: build products that represent who we are and where we come from.
          </p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted)" }}>
            We design premium apparel, electronics, and lifestyle gear that reflect{" "}
            <strong style={{ color: "var(--text)" }}>identity, strength, and purpose</strong>.
            Every drop, every design, every message is crafted with meaning — built for the people who move like kings in their everyday life.
          </p>
          <p className="font-bold" style={{ color: "var(--tx)" }}>
            This isn't just a brand. It's a movement. A legacy in motion.
          </p>
        </div>
      </section>

      {/* Why Shop With Us + FAQ */}
      <section style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-16">
          {/* Why Us */}
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--co)" }}>
              Why Choose Us
            </div>
            <h2 className="font-display text-3xl mb-6">BUILT DIFFERENT</h2>
            <ul className="space-y-3">
              {[
                "Premium Quality Materials",
                "Fast Shipping — 3-7 business days",
                "4.9★ Customer Rating",
                "Exclusive Limited Drops",
                "Secure Checkout",
                "Culture-Driven Designs",
                "Easy 14-Day Returns",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "var(--muted)" }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "var(--tx)" }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* FAQ */}
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--co)" }}>
              FAQ
            </div>
            <h2 className="font-display text-3xl mb-6">QUESTIONS?</h2>
            <div className="space-y-5">
              {[
                { q: "Do you ship worldwide?", a: "Yes, we ship internationally to most countries." },
                { q: "How long does shipping take?", a: "U.S. orders: 3–7 business days. International timing varies by location." },
                { q: "Can I return my order?", a: "Yes — within 14 days if unused and in original condition." },
                { q: "How do I contact support?", a: "Email us at support@ltronicspowerhouse.store — we respond within 24 hours." },
              ].map((item) => (
                <div key={item.q}>
                  <div className="font-semibold text-sm mb-1">{item.q}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Email Signup */}
      <section className="max-w-6xl mx-auto px-5 py-20 text-center">
        <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--co)" }}>
          Join the Circle
        </div>
        <h2 className="font-display text-4xl md:text-5xl mb-4">POWERHOUSE CIRCLE</h2>
        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "var(--muted)" }}>
          Get early access to drops, exclusive discounts, and members-only releases.
        </p>
        <form
          className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-full text-sm outline-none"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-full font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--tx)" }}
          >
            Unlock 10% Off
          </button>
        </form>
      </section>
    </div>
  );
}
