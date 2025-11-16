// src/pages/LandingLogin.jsx
import React, { useState,useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import LandingHeader from "../components/Landing/LandingHeader";
import TwoFactor from "../auth/TwoFactor";
import { useSession } from "../session/SessionContext";

const bypassAuthRequest = async () => {
  const res = await fetch("/api/auth/bypass-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", 
  });
  if (!res.ok) {
    throw new Error("Backend bypass failed.");
  }
  return res.json();
};

export default function LandingLogin() {
  const [step, setStep] = useState("login");  // 'login' | '2fa'
  const [banner, setBanner] = useState(null);
  const [searchParams] = useSearchParams();
  const { login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();


// bypassAuthRequest
useEffect(() => {
    const testBypass = searchParams.get("test") === "true";
    const authOk = searchParams.get("auth") === "ok";

    if (authOk) {
      setStep("2fa");
    }

    // ✅ FIX: ย้าย Logic การ Redirect เข้ามาใน useEffect โดยตรง
    if (testBypass) {
        const runBypass = async () => {
            try {
                setBanner("Attempting full authentication bypass...");
                
                // 1. Call Backend to set Flask Session
                await bypassAuthRequest(); 
                
                // 2. Call Frontend Session Provider to set timer
                login(); 
                
                setBanner("Bypass successful! Redirecting...");
                
                // 3. THE REDIRECT STEP: Now runs within the effect's async chain
                navigate("/showcase", { replace: true });

            } catch (error) {
                console.error("Full bypass failed:", error);
                setBanner(`Full bypass failed: ${error.message}`);
            }
        };
        runBypass();
    }

    // ส่วนของ Logic เดิม (auth=ok)
    // ...

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // [searchParams] คือ Dependency ที่ถูกต้อง

  const expiredMsg =
    location.state && location.state.reason === "expired"
      ? "Your session expired. Please sign in again."
      : null;

  const handle2FASuccess = () => {
    login();
    navigate("/showcase", { replace: true });
  };

  const handleMaxFail = () => {
    // back to login card + show banner
    setStep("login");
    setBanner("Too many incorrect OTP attempts. Please sign in again.");
  };

  if (step === "2fa") {
    return (
      <TwoFactor
        onSuccess={handle2FASuccess}
        onBack={() => setStep("login")}
        onMaxFail={handleMaxFail}
      />
    );
  }

  return (
    <div className="min-h-screen bg-mOrange text-white">
      <LandingHeader variant="login" />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center">
        {(expiredMsg || banner) && (
          <div className="mb-4 rounded-lg bg-black/20 px-4 py-2 text-sm font-anuphan">
            {banner || expiredMsg}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-athiti font-bold tracking-tight mb-2">
          Log in or Sign up
        </h1>
        <p className="text-sm text-black max-w-prose mb-10 font-athiti font-bold">
          Join us! Sign in to explore projects and connect with others.
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-lg text-neutral-900">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-2xl grid place-items-center bg-white">
              <img
                src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                alt="Google logo"
                className="w-24 h-24"
              />
            </div>

            <button
              type="button"

              onClick={() => {
                // Integration note: backend OAuth entrypoint lives at /api/auth/login; update path if auth routes change.
                window.location.href = "/api/auth/login";
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
