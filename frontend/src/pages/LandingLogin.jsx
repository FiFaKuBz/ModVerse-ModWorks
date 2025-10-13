import React from "react";
import LandingHeader from "../components/Landing/LandingHeader";

export default function LandingLogin() {
  return (
    <div className="min-h-screen bg-mOrange text-white">
      {/* Header (สีขาวด้านบน) */}
      <LandingHeader />

      {/* ส่วนเนื้อหา */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center">
        <h1 className="text-2xl sm:text-3xl font-athiti font-bold tracking-tight mb-2">
          Log in or Sign up
        </h1>

        <p className="text-sm text-black max-w-prose mb-10 font-athiti font-bold">
          Join us! Sign in to explore projects and connect with others.
        </p>

        {/* การ์ดสีขาว (ขยายขนาด) */}
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-lg text-neutral-900">
          <div className="flex flex-col items-center">
            {/* โลโก้ Google (ขยายขึ้นอีกนิด) */}
            <div className="w-28 h-28 rounded-2xl grid place-items-center bg-white">
              <img
                src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                alt="Google logo"
                className="w-24 h-24"
              />
            </div>

            {/* ปุ่มตามสเปค: Anuphan semibold */}
            {/* <button
              type="button"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-20 py-3 text-sm font-anuphan font-semibold text-neutral-800 hover:bg-neutral-50 active:scale-[.99] transition"
            >
              Continue with Google
            </button> */}

            <button
              type="button"
              onClick={() => {
                // redirects browser to backend which starts Google OAuth
                window.location.href = "/login";
              }}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-20 py-3 text-sm font-anuphan font-semibold text-neutral-800 hover:bg-neutral-50 active:scale-[.99] transition"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </main>

      
    </div>
  );
}
