import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LandingHeader from "../components/Landing/LandingHeader";
import TwoFactorMock from "../auth/TwoFactorMock";
import { useSession } from "../session/SessionProvider";

export default function LandingLogin() {
  const [step, setStep] = useState("login");         // 'login' → '2fa'
  const { login } = useSession();                    // start session
  const navigate = useNavigate();
  const location = useLocation();

  // Go to mock 2FA (in real app you'd redirect to backend OAuth)
  const handleGoogleLogin = () => setStep("2fa");

  // When 2FA succeeds, start session + go showcase
  const handle2FASuccess = () => {
    login();
    navigate("/showcase", { replace: true });
  };

  // If session expired redirected here, show a small banner message
  const expiredMsg =
    location.state && location.state.reason === "expired"
      ? "Your session expired. Please sign in again."
      : null;

  if (step === "2fa") {
    return <TwoFactorMock onSuccess={handle2FASuccess} onBack={() => setStep("login")} />;
  }

  return (
    <div className="min-h-screen bg-mOrange text-white">
      <LandingHeader variant="login" />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center">
        {expiredMsg && (
          <div className="mb-4 rounded-lg bg-black/20 px-4 py-2 text-sm font-anuphan">
            {expiredMsg}
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

            {/* mock OAuth → 2FA */}
            <button
              type="button"

              onClick={() => {
                // redirects browser to backend which starts Google OAuth
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
