import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "../lib/cart";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, toggleCart } = useCart();
  const [location] = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/kingz-talk", label: "Kingz Talk" },
    { to: "/custom-request", label: "Custom Order" },
    { to: "/rewards", label: "Rewards" },
  ];

  const cartCount = count();

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(8, 6, 8, 0.94)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(232,96,10,0.2)",
          boxShadow: "0 1px 0 rgba(0,170,255,0.08)",
        }}
      >
        {/* TX/CO top line */}
        <div
          style={{
            height: 2,
            background: "linear-gradient(90deg, #e8600a 0%, #c9922a 50%, #00aaff 100%)",
          }}
        />

        <div className="max-w-6xl mx-auto px-5 h-15 flex items-center justify-between" style={{ height: 60 }}>
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <img
                src="/logo-skull.png"
                alt="Ltronics PowerHouse Kingz"
                className="w-10 h-10 rounded object-cover"
                style={{ border: "1px solid rgba(232,96,10,0.3)" }}
              />
              <div>
                <div
                  className="font-display text-xl leading-none"
                  style={{ color: "#c9922a" }}
                >
                  LTRONICS
                </div>
                <div className="text-[8px] tracking-widest font-semibold" style={{ color: "var(--muted)" }}>
                  POWERHOUSE KINGZ
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link key={l.to} to={l.to}>
                <span
                  className="text-sm font-medium tracking-wide transition-colors cursor-pointer"
                  style={{
                    color: location === l.to ? "var(--tx)" : "var(--muted)",
                  }}
                  onMouseEnter={(e) => { if (location !== l.to) (e.target as HTMLElement).style.color = "var(--co)"; }}
                  onMouseLeave={(e) => { if (location !== l.to) (e.target as HTMLElement).style.color = "var(--muted)"; }}
                >
                  {l.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleCart}
              className="relative p-2 rounded transition-colors"
              style={{ color: "var(--text)" }}
              aria-label="Open cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: "var(--tx)" }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden border-t"
            style={{ background: "var(--bg-alt)", borderColor: "var(--border)" }}
          >
            <div className="px-5 py-4 flex flex-col gap-4">
              {links.map((l) => (
                <Link key={l.to} to={l.to}>
                  <span
                    className="block text-sm font-medium cursor-pointer"
                    style={{ color: location === l.to ? "var(--tx)" : "var(--text)" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {l.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
