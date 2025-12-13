import { useRef, useEffect } from "react";
import { useNotification } from "../../session/NotificationContext";
import { useNavigate } from "react-router-dom";

export default function NotificationList() {
  const { notifications, isOpen, setIsOpen, markAsRead, markAllAsRead } = useNotification();
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const handleItemClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    
    if (notification.type === "follow") {
        navigate(`/profile/${notification.sender_id}`); // Ideally username, but ID works if route supports it or we fetch user
        // Since we store sender_id, we might need to fetch user details or just link to profile/id if supported
        // For now, let's assume we can navigate to profile page. 
        // Actually, the notification message doesn't contain username. 
        // We might want to enhance the backend to return sender details (name/avatar) populated.
        // For now, let's just close.
    } else if (notification.project_id) {
        navigate(`/project/${notification.project_id}`);
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 font-IBM"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        {notifications.length > 0 && (
            <button 
                onClick={markAllAsRead}
                className="text-xs text-mOrange hover:underline"
            >
                Mark all read
            </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleItemClick(n)}
              className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                !n.is_read ? "bg-blue-50/50" : ""
              }`}
            >
              <div className="flex gap-3">
                 {/* Icon based on type */}
                 <div className="mt-1 flex-shrink-0">
                    {n.type === 'like' && <span className="text-red-500">❤️</span>}
                    {n.type === 'comment' && <span className="text-blue-500">💬</span>}
                    {n.type === 'follow' && <span className="text-green-500">👤</span>}
                    {n.type === 'system' && <span className="text-gray-500">📢</span>}
                 </div>
                 <div>
                    <p className="text-sm text-gray-800 leading-snug">
                        {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                 </div>
                 {!n.is_read && (
                    <div className="ml-auto mt-2 w-2 h-2 bg-mOrange rounded-full flex-shrink-0"></div>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
