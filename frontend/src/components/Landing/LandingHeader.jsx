import { useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import TopicTray from "../topics/TopicTray";

export default function LandingHeader({
  topics = [],
  topic = "all",
  onChangeTopic,
  variant, // "login" or "default"
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openTopics, setOpenTopics] = useState(false);

  // determine variant automatically if not provided
  const isLogin =
    variant === "login" || location.pathname === "/" || location.pathname === "/landing";

  // de-dupe topics
  const trayTopics = useMemo(() => {
    const uniq = Array.from(new Set(topics));
    return ["all", ...uniq];
  }, [topics]);

  //logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {

        localStorage.removeItem('user_token');

        navigate('/'); 
      } else {
        console.error("Logout API call failed.");
      }
    } catch (error) {
      console.error("Network error during logout:", error);
    }
  };

  return (
    <header
      className={`${
        isLogin
          ? "bg-white text-black shadow-sm"
          : "sticky top-0 z-50 bg-white/95 backdrop-blur"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* logo */}
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
          {/* show About always */}
          <Link
            to="/landing-about"
            className="inline-flex items-center gap-2 text-[18px] hover:opacity-80"
          >
            About
          </Link>

          {/* show the following only if NOT on login variant */}
          {!isLogin && (
            <>
              {/* user icon */}
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 text-[18px] hover:opacity-80"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-yellow-500"
                >
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.2 0-8 2.1-8 5v1h16v-1c0-2.9-3.8-5-8-5Z" />
                </svg>
              </Link>

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

              {/*logout button*/ }
          <Link
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-[18px] hover:opacity-80"
          >
            Logout
          </Link>
            </>
          )}
        </nav>
      </div>

      {/* topic tray only for logged-in variant */}
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
