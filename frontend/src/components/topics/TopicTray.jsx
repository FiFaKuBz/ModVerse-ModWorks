import { useEffect, useRef } from "react";

const tagColors = {
  "UX/UI": "bg-mPurple text-black",
  Transportation: "bg-mBlue text-black",
  Database: "bg-mYellow text-black",
  Algorithm: "bg-mGreen text-black",
  "Digital Circuit": "bg-mPink text-black",
  "Data Visualization": "bg-mSalmon text-black",
};

export default function TopicTray({
  open,
  topics = [],
  selected = null,
  onSelect,
  onClose,
}) {
  const trayRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (trayRef.current && !trayRef.current.contains(e.target)) onClose?.();
    };
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed left-0 right-0 top-16 z-40" // sits right below a 64px (h-16) header
      aria-live="polite"
    >
      <div
        ref={trayRef}
        className="w-full bg-white border-b shadow-sm"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2">
          {/* Chip cloud */}
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => {
              const active = selected === t;
              return (
                <button
                  key={t}
                  onClick={() => onSelect?.(t)}
                  className={[
                    // base chip
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border",
                    // color family (fallback to neutral)
                    tagColors[t] || "bg-neutral-100 text-neutral-800",
                    // border + active ring
                    active
                      ? "border-black ring-1 ring-black"
                      : "border-neutral-300 hover:border-neutral-500",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
