import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import TopicTray from "../topics/TopicTray";
import { useSession } from "../../session/SessionContext";
import MVMWlogo from "../../assets/MVMWlogo.svg";
import { getProfile } from "../../api/profile";
import { useNotification } from "../../session/NotificationContext";
import NotificationList from "../Notification/NotificationList";

export default function LandingHeader({
  topics = [],
  selectedTopics = [],
  onChangeTopic,
  variant,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useSession();
  const [openTopics, setOpenTopics] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  // Notification context
  const { unreadCount, isOpen: isNotifOpen, setIsOpen: setIsNotifOpen } = useNotification();

  const menuRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        // FIX 2: Use the setter defined above
        if (res && res.avatar) {
            setAvatarUrl(res.avatar);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const isLogin =
    variant === "login" || location.pathname === "/login" || location.pathname === "/landing";
  const isShowcase = location.pathname === "/";

  const trayTopics = useMemo(() => {
    const uniq = Array.from(new Set(topics)).filter((t) => t !== "all");
    return uniq;
  }, [topics]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.removeItem("user_token");
        logout();
        setOpenMenu(false);
        navigate("/");
      } else {
        console.error("Logout API call failed.");
      }
    } catch (error) {
      console.error("Network error during logout:", error);
    }
  };

  useEffect(() => {
    setOpenTopics(false);
  }, [location.pathname]);

  return (
    <header
      className={`${
        isLogin ? "bg-white text-black shadow-sm" : "sticky top-0 z-50 bg-white/95 backdrop-blur"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex-shrink-0 flex items-center"
          aria-label="Go to Showcase"
        >
          <img src={MVMWlogo} alt="ModVerse ModWorks Logo" className="h-20 w-auto" />
        </button>
        <nav className="flex items-center gap-4 font-An font-semibold">
          <Link
            to="/landing-about"
            className="inline-flex items-center gap-2 text-[18px] hover:opacity-80"
          >
            About
          </Link>
          {!isLogin && (
            <>
              {isShowcase && (
                <button
                  type="button"
                  onClick={() => setOpenTopics((prev) => !prev)}
                  aria-expanded={openTopics}
                  aria-controls="topics-tray"
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-3 py-1 text-[18px]",
                    "bg-white border border-yellow-500 text-black hover:bg-neutral-50 transition",
                  ].join(" ")}
                >
                  Topics
                  <span
                    className={`inline-block transition-transform duration-200 ${
                      openTopics ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
              )}
              
              {/* Notification Bell */}
              <div className="relative">
                <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                <NotificationList />
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpenMenu((v) => !v)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-yellow-500"
                  aria-expanded={openMenu}
                >
              {avatarUrl ? (
                    <img src={avatarUrl} alt="User Profile" className="w-full h-full object-cover rounded-full"/>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-500">
                        <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.2 0-8 2.1-8 5v1h16v-1c0-2.9-3.8-5-8-5Z" />
                    </svg>
                  )}
                </button>
                {openMenu && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg overflow-hidden z-50" role="menu">
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
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

            </>
          )}
        </nav>
      </div>

      {!isLogin && isShowcase && (
        <TopicTray
          open={openTopics}
          topics={trayTopics}
          selected={selectedTopics}
          onSelect={(topic) => onChangeTopic?.(topic)}
          onClose={() => setOpenTopics(false)}
        />
      )}
    </header>
  );
}
