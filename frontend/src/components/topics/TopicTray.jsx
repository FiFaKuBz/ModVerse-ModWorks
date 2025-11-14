// src/components/topics/TopicTray.jsx
import { useRef } from "react"; // <<< Removed useEffect

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
  selected = [],
  onSelect,
  // <<< Accept the new hover props
  onMouseEnter,
  onMouseLeave,
}) {
  const trayRef = useRef(null);

  // <<< Removed the useEffect for click-outside and Esc
  // (This implements the hover-only logic you asked for)

  if (!open) return null;

  return (
    <div
      // <<< Add the hover handlers to the main div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed left-0 right-0 top-20 z-40" 
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
              const active = selected.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => onSelect?.(t)} 
                  className={[
                    // base chip
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-An font-medium border",
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