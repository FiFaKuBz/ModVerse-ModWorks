import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import TopicTray from "../topics/TopicTray";
import { useSession } from "../../session/SessionProvider";

export default function LandingHeader({
  topics = [],
  topic = "all",
  onChangeTopic,
  variant, // "login" or "default"
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useSession();
  const [openTopics, setOpenTopics] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const isLogin =
    variant === "login" || location.pathname === "/" || location.pathname === "/landing";

  const trayTopics = useMemo(() => {
    const uniq = Array.from(new Set(topics));
    return ["all", ...uniq];
  }, [topics]);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`${
        isLogin
          ? "bg-white text-black shadow-sm"
          : "sticky top-0 z-50 bg-white/95 backdrop-blur"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
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

        {/* Right side */}
        <nav className="flex items-center gap-4 font-anuphan font-semibold">
          <Link
            to="/landing-about"
            className="inline-flex items-center gap-2 text-[18px] hover:opacity-80"
          >
            About
          </Link>

          {/* Hide menu & topics on login */}
          {!isLogin && (
            <>
              {/* Dropdown user menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpenMenu((v) => !v)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-yellow-500"
                  aria-expanded={openMenu}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 text-yellow-500"
                  >
                    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.2 0-8 2.1-8 5v1h16v-1c0-2.9-3.8-5-8-5Z" />
                  </svg>
                </button>

                {/* Dropdown menu content */}
                {openMenu && (
                  <div
                    className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg overflow-hidden"
                    role="menu"
                  >
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setOpenMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setOpenMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setOpenMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Topics button */}
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
            </>
          )}
        </nav>
      </div>

      {/* Topic tray for logged-in variant */}
      {!isLogin && (
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
      )}
    </header>
  );
}
