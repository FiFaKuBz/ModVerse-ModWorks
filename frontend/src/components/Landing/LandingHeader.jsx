import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopicTray from "../topics/TopicTray";

export default function LandingHeader({
  topics = [],
  topic = "all",
  onChangeTopic,
}) {
  const navigate = useNavigate();
  const [openTopics, setOpenTopics] = useState(false);

  // de-dupe + ensure "all"
  const trayTopics = useMemo(() => {
    const uniq = Array.from(new Set(topics));
    return ["all", ...uniq];
  }, [topics]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* keep your original logo block */}
        <button
          onClick={() => navigate("/showcase")}
          className="font-athiti font-bold text-left text-xl leading-none"
          aria-label="Go to Showcase"
        >
          <span className="block">ModVerse</span>
          <span className="-mt-1 block text-sm font-bold tracking-wide">
            ModWorks
          </span>
        </button>

        {/* right side */}
        <nav className="flex items-center gap-4 font-anuphan font-semibold">
          {/* user icon -> /profile */}
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-[18px] hover:opacity-80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-yellow-500"
              aria-hidden="true"
            >
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.2 0-8 2.1-8 5v1h16v-1c0-2.9-3.8-5-8-5Z" />
            </svg>
            </Link>
          <Link
            to="/landing-about"
            className="inline-flex items-center gap-2 text-[18px] hover:opacity-80"
          >
            About
          </Link>

          {/* Topics button with yellow border */}
          <button
            type="button"
            onClick={() => setOpenTopics((v) => !v)}
            aria-expanded={openTopics}
            aria-controls="topics-tray"
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3 py-1 text-[18px]",
              "bg-white border border-yellow-500 text-black hover:bg-neutral-50 transition",
            ].join(" ")}
          >
            Topics
            <span className="inline-block -mt-[2px]">
              {openTopics ? "▴" : "▾"}
            </span>
          </button>
        </nav>
      </div>

      {/* topic tray under the header */}
      <TopicTray
        open={openTopics}
        topics={trayTopics}
        selected={topic}
        onSelect={(t) => {
          onChangeTopic?.(t);
          setOpenTopics(false);
        }}
        onClose={() => setOpenTopics(false)}
      />
    </header>
  );
}
