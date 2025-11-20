import { getTopicChipClass } from "../../constants/topicColors";

const TopicTray = ({ open, topics = [], selected = [], onSelect, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed left-0 right-0 top-20 z-40" aria-live="polite">
      <div className="w-full bg-white border-b shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => {
              const active = selected.includes(t);
              const chipClass = getTopicChipClass(t) || "bg-neutral-100 text-neutral-800";
              return (
                <button
                  key={t}
                  onClick={() => {
                    onSelect?.(t);
                    onClose?.();
                  }}
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-An font-medium border",
                    active ? `${chipClass} border-black ring-1 ring-black` : `${chipClass} border-neutral-300 hover:border-neutral-500`,
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
};

export default TopicTray;
