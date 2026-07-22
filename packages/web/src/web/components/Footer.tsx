import { Instagram, Twitter, DollarSign } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer
      className="mt-auto pt-12 pb-8"
      style={{
        background: "var(--bg-alt)",
        borderTop: "3px solid transparent",
        borderImage: "linear-gradient(90deg, var(--tx), var(--brand-gold), var(--co)) 1",
      }}
    >
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.jpg" alt="Ltronics PowerHouse" className="w-10 h-10 rounded object-cover" />
              <div>
                <div className="font-display text-xl leading-none" style={{ color: "var(--brand-gold)" }}>
                  LTRONICS
                </div>
                <div className="text-[9px] tracking-widest" style={{ color: "var(--muted)" }}>
                  POWERHOUSE KINGZ CO
                </div>
              </div>
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Built for Kingz. Powered by Hustle.
            </p>
            <div className="flex gap-4 mt-4 flex-wrap items-center">
              <a
                href="#"
                className="transition-colors"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = "var(--tx)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"}
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="transition-colors"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = "var(--co)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"}
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://cash.app/$PowerHouseKingzCo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all"
                style={{ background: "rgba(0,212,80,0.12)", border: "1px solid rgba(0,212,80,0.35)", color: "#00d450" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,212,80,0.22)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,212,80,0.12)"; }}
              >
                <DollarSign size={11} />
                PowerHouseKingzCo
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--tx)" }}>
              Shop
            </h4>
            <ul className="flex flex-col gap-2">
              {["T-Shirts", "Hoodies", "Hats", "Electronics", "Accessories"].map((cat, i) => (
                <li key={cat}>
                  <Link to={`/shop?category=${cat}`}>
                    <span
                      className="text-sm cursor-pointer transition-colors"
                      style={{ color: "var(--muted)" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLSpanElement).style.color = i % 2 === 0 ? "var(--tx)" : "var(--co)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLSpanElement).style.color = "var(--muted)"}
                    >
                      {cat}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--co)" }}>
              Info
            </h4>
            <ul className="flex flex-col gap-2">
              {[
                { label: "Track Order", to: "/orders" },
                { label: "Admin Panel", to: "/admin" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>
                    <span
                      className="text-sm cursor-pointer transition-colors"
                      style={{ color: "var(--muted)" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLSpanElement).style.color = "#fff"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLSpanElement).style.color = "var(--muted)"}
                    >
                      {l.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-2 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <span>© {new Date().getFullYear()} Ltronics PowerHouse × PowerHouse Kingz Co. All rights reserved.</span>
          <span style={{ color: "var(--brand-gold)" }}>Built for Kingz. Powered by Hustle.</span>
        </div>
      </div>
    </footer>
  );
}
