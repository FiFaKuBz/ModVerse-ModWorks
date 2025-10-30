import { useState } from "react";

const KEY = "mv_2fa_enabled";

export default function SettingPage() {
  // Default to enabled when not set
  const [enabled, setEnabled] = useState(() => {
    const v = localStorage.getItem(KEY);
    if (v === null) {
      localStorage.setItem(KEY, "1");
      return true;
    }
    return v === "1";
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Two-Factor Authentication (2FA)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enable, disable, or reset your 2FA configuration (mock).
        </p>

        <div className="flex items-center gap-3 mb-3">
          <input
            id="twofa"
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              const v = e.target.checked;
              setEnabled(v);
              localStorage.setItem(KEY, v ? "1" : "0");
            }}
          />
          <label htmlFor="twofa">Enable 2FA</label>
        </div>

        <button
          onClick={() => {
            localStorage.setItem(KEY, "1");
            setEnabled(true);
            alert("2FA reset to default (enabled). (Mock)");
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          Reset 2FA
        </button>
      </div>
    </div>
  );
}
