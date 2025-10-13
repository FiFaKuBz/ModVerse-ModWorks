import React from "react";
import { Link, useNavigate } from "react-router-dom";

function UserIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.2 0-8 2.1-8 5v1h16v-1c0-2.9-3.8-5-8-5Z" />
    </svg>
  );
}

export default function LandingHeader() {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-white text-neutral-900 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* โลโก้ → ไปหน้า Landing */}
        <button
          onClick={() => navigate("/landing")}
          className="font-athiti font-bold text-left text-xl leading-none"
        >
          <span className="block">ModVerse</span>
          <span className="-mt-1 block text-sm font-bold tracking-wide">
            ModWorks
          </span>
        </button>

        {/* เมนู */}
        <nav className="flex items-center gap-4 font-anuphan font-semibold">
      

          {/* ไปหน้า LandingAbout */}
          <Link
            to="/landing-about"
            className="inline-flex items-center gap-2 text-sm hover:opacity-80"
          >
            About
          </Link>

        </nav>
      </div>
    </header>
  );
}
