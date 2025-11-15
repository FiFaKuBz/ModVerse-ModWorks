import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../api/profile";

export default function SettingPage() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let canceled = false;
    const loadSettings = async () => {
      try {
        const profile = await getProfile();
        if (!canceled && profile) {
          setEnabled(profile.twoFactorEnabled !== false);
        }
      } catch {
        if (!canceled) setEnabled(true);
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    loadSettings();
    return () => {
      canceled = true;
    };
  }, []);

  const applyTwoFactor = async (nextValue) => {
    const previous = enabled;
    setEnabled(nextValue);
    setSaving(true);
    setError("");
    try {
      // Integration note: updateProfile abstracts the PATCH /api/users/profile call; extend payload here if backend adds more toggles.
      await updateProfile({ twoFactorEnabled: nextValue });
    } catch {
      setEnabled(previous);
      setError("ไม่สามารถอัปเดตการตั้งค่า 2FA ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Two-Factor Authentication (2FA)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Manage your 2FA preference. Changes sync to the backend when you toggle the setting.
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">กำลังโหลดการตั้งค่า...</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <input
                id="twofa"
                type="checkbox"
                checked={enabled}
                disabled={saving}
                onChange={(e) => applyTwoFactor(e.target.checked)}
              />
              <label htmlFor="twofa">Enable 2FA</label>
            </div>

            <button
              type="button"
              onClick={() => applyTwoFactor(true)}
              disabled={saving}
              className={`rounded-lg border px-3 py-2 text-sm ${
                saving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Reset 2FA
            </button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
