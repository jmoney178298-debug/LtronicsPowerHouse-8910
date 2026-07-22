import { useFaultScroll } from "../hooks/useFaultScroll";

/**
 * Site-wide "Street ↔ Crown" fault line background.
 * Fixed behind all routed content. As the user scrolls down the page, the
 * royal marble/gold "Crown" layer rises up from the bottom and covers the
 * gritty "Street" layer beneath — a living transition, not a static split.
 */
export function FaultBackground() {
  useFaultScroll();

  return (
    <div aria-hidden className="fault-bg" style={{ position: "fixed", inset: 0, zIndex: -2, overflow: "hidden" }}>
      {/* Street layer — always full coverage, base state */}
      <div className="fault-street" />
      {/* Crown layer — diagonal clip, rises with scroll */}
      <div className="fault-crown" />
      {/* Glowing seam line along the diagonal edge */}
      <div className="fault-seam" />
      {/* Dark overlay so content stays readable over textures */}
      <div className="fault-overlay" />
    </div>
  );
}
