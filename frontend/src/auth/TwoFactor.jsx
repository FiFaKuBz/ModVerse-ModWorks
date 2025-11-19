// src/auth/TwoFactorMock.jsx (Updated to connect to API)
import { useEffect, useRef, useState } from "react";

const STATIC_OTP = "000000";


// Helper function to simulate a mock API request with latency (800ms)
// This completely replaces the need for the original fetch-based authRequest.
const mockRequest = (successData, failureMessage, isSuccess = true) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (isSuccess) {
                // Simulate a successful API response structure
                resolve({ ok: true, ...successData });
            } else {
                // Simulate an API error response structure
                reject(new Error(failureMessage));
            }
        }, 100); // Simulate 800ms network latency
    });
};


// // Helper function สำหรับเรียก API โดยเฉพาะสำหรับ Auth
// const authRequest = async (endpoint, options = {}) => {
//   const res = await fetch(`/api/auth${endpoint}`, {
//     headers: { "Content-Type": "application/json" },
//     credentials: "include", // สำคัญ: ใช้สำหรับส่ง Session Cookie
//     ...options,
//   });

//   // Backend response for error is {"ok": false, "error": "message"}
//   const data = await res.json(); 

//   if (!res.ok || data.ok === false) {
//     throw new Error(data.error || "Verification failed");
//   }
//   return data;
// };

export default function TwoFactorAuth({
  onSuccess,
  onBack,
  onMaxFail,
  maxAttempts = 5, // Backend handles attempts, but this tracks UI state
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(maxAttempts);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);


  	// Mock API Call: Verify OTP
	const verifyOtpApi = (inputCode) => {
		// Check against the static success code
		if (inputCode === STATIC_OTP) {
			console.log("Mock Success: STATIC_OTP matched.");
			return mockRequest({ message: "Verification successful" });
		}

		// Simulate failure for any other code
		console.log("Mock Failure: Invalid code.");
		return mockRequest(
			null,
			"Invalid or expired OTP",
			false
		);
	};

	// Mock API Call: Resend OTP
	const resendOtpApi = () => {
		// Resending always succeeds in the mock environment
		console.log("Mock Resend: New code sent (static code 000000).");
		return mockRequest({ message: "New OTP generated and sent" });
	};
	// ------------------------------------------

  // // API Call: Verify OTP
  // const verifyOtpApi = (code) =>
  //   authRequest("/verify-otp", {
  //     method: "POST",
  //     body: JSON.stringify({ code }),
  //   });

  // // API Call: Resend OTP
  // const resendOtpApi = () => 
  //   authRequest("/resend-otp", {
  //     method: "POST",
  //   });

  const submit = async (e) => {
    e?.preventDefault?.();
    if (code.length !== 6 || isSending) return;
    
    setIsSending(true);
    setErr("");

    try {
      await verifyOtpApi(code);
      onSuccess?.(); // Login successful, navigate to /showcase
    } catch (error) {
      const next = Math.max(0, attemptsLeft - 1);
      setAttemptsLeft(next);
      
      // การจัดการข้อความแสดงผลจากการตอบกลับของ Backend
      const errorMessage = error.message.includes("Invalid or expired OTP") 
        ? "Incorrect or expired code." 
        : error.message;

      if (next === 0 || error.message.includes("Too many attempts")) {
        setErr("Too many incorrect attempts. Returning to sign in…");
        setTimeout(() => onMaxFail?.(), 2000); 
      } else {
        setErr(errorMessage + ` ${next} attempt(s) left.`);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async () => {
    if (isSending || attemptsLeft === 0) return;
    setIsSending(true);
    setErr("");

    try {
      await resendOtpApi();
      setErr("New code sent to your email. Check your spam folder!");
      setCode(""); // Clear previous code
      inputRef.current?.focus();
    } catch {
      setErr("Failed to resend code. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-black p-8">
        <h1 className="text-xl font-semibold mb-1">Two-Factor Verification</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Enter the 6-digit code sent to your email.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            disabled={attemptsLeft <= 0 || isSending}
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
              disabled={attemptsLeft <= 0 || code.length !== 6 || isSending}
              className={`rounded-xl px-4 py-2 border border-black ${
                attemptsLeft <= 0 || code.length !== 6 || isSending
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-black text-white hover:opacity-90"
              }`}
            >
              {isSending ? "Verifying..." : "Verify"}
            </button>
            
            <button
              type="button"
              onClick={handleResend}
              disabled={attemptsLeft <= 0 || isSending}
              className="rounded-xl px-4 py-2 border border-black hover:bg-gray-50"
            >
              Resend Code
            </button>
          </div>
          
          <button
              type="button"
              onClick={() => onBack?.()}
              disabled={isSending}
              className="mt-2 text-sm text-neutral-500 hover:underline"
          >
              ← Back to Sign In
          </button>

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
