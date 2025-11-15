import { useSession } from "./SessionProvider";

export function IdleWarningModal() {
  const { warn, setWarn, bump, logout } = useSession();

  if (!warn) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-sm text-center shadow-lg">
        <h2 className="text-lg font-bold mb-2">⚠️ Session Expiring Soon</h2>
        <p className="text-sm text-gray-700 mb-4">
          Your session will expire in 30 seconds. Would you like to stay signed in?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              bump();
              setWarn(false);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Stay Signed In
          </button>
          <button
            onClick={() => logout(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
