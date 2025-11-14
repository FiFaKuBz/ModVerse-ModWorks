// src/auth/TwoFactorMock.jsx
import { useEffect, useRef, useState } from "react";

const STATIC_OTP = "246810"; // static code for mock

export default function TwoFactorMock({
  onSuccess,      // called when OTP correct
  onBack,         // go back to Google card
  onMaxFail,      // called when attempts exhausted
  maxAttempts = 3,
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(maxAttempts);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e) => {
    e?.preventDefault?.();
    if (attemptsLeft <= 0) return;

    if (code.trim() === STATIC_OTP) {
      setErr("");
      onSuccess?.();
      return;
    }

    const next = Math.max(0, attemptsLeft - 1);
    setAttemptsLeft(next);
    if (next === 0) {
      setErr("Too many incorrect attempts. Returning to sign in…");
      onMaxFail?.();
    } else {
      setErr(`Incorrect code. ${next} attempt(s) left.`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-black p-8">
        <h1 className="text-xl font-semibold mb-1">Two-Factor Verification</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Enter the 6-digit code sent to your email. (Mock code: <b>246810</b>)
        </p>

        <form onSubmit={submit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            disabled={attemptsLeft <= 0}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="Enter 6-digit code"
            className="w-full rounded-xl border border-black px-4 py-3 outline-none focus:ring-0"
          />

          {err && <div className="text-sm text-red-600">{err}</div>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={attemptsLeft <= 0 || code.length !== 6}
              className={`rounded-xl px-4 py-2 border border-black ${
                attemptsLeft <= 0 || code.length !== 6
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-black text-white hover:opacity-90"
              }`}
            >
              Verify
            </button>

            <button
              type="button"
              onClick={() => onBack?.()}
              disabled={attemptsLeft <= 0}
              className="rounded-xl px-4 py-2 border border-black hover:bg-gray-50"
            >
              Back
            </button>
          </div>

          {attemptsLeft > 0 && (
            <div className="text-xs text-neutral-500 mt-2">
              Attempts remaining: {attemptsLeft}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
