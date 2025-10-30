import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

const MOCK_CODE = "123456";

export default function TwoFactorMock({ onSuccess, onBack }) {
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30); // resend cooldown
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    // simulate sending code
    const t = setTimeout(() => setSent(true), 350);
    return () => clearTimeout(t);
  }, []);

  // simple countdown for "Resend"
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const verify = () => {
    if (code.trim() === MOCK_CODE) {
      setError("");
      onSuccess?.();
    } else {
      setError("Invalid code. Please try again.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") verify();
  };

  const resend = () => {
    if (countdown > 0) return;
    setCountdown(30);
    setSent(true);
    // You can toast here "New code sent"
  };

  return (
    <div className="min-h-screen bg-mOrange text-white">
      {/* keep your landing header look consistent if you want it here */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-white/90 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
      </div>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20 flex flex-col items-center text-center">
        <h1 className="text-2xl sm:text-3xl font-athiti font-bold tracking-tight mb-2">
          Two-Factor Authentication
        </h1>
        <p className="text-sm text-black max-w-prose mb-8 font-athiti font-bold">
          Enter the 6-digit code we just sent to your email. </p>

        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-neutral-900">
          <div className="space-y-4">
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit code"
              className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-lg tracking-widest text-center outline-none focus:ring-1 focus:ring-black"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={verify}
              className="w-full rounded-xl bg-black text-white py-3 font-anuphan font-semibold hover:opacity-90 active:scale-[.99] transition"
            >
              Verify
            </button>

            <div className="text-sm text-neutral-700 flex items-center justify-between pt-2">
              <span>{sent ? "Code sent to your email." : "Sending code…"}</span>
              <button
                onClick={resend}
                disabled={countdown > 0}
                className={`underline disabled:no-underline disabled:opacity-50`}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
