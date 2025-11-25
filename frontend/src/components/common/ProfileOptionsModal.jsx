import { useState, useEffect } from "react";
import { X } from "lucide-react";

// ✅ รับทั้ง userId (สำหรับ Block) และ username (สำหรับ Report)
export default function ProfileOptionsModal({ isOpen, onClose, userId, username, isBlockedInitial }) {
  const [isBlocked, setIsBlocked] = useState(isBlockedInitial || false);
  const [showReportReasons, setShowReportReasons] = useState(false);
  const [otherReason, setOtherReason] = useState("");

  // อัปเดตสถานะเมื่อเปิด Modal ใหม่ หรือค่าเริ่มต้นเปลี่ยน
  useEffect(() => {
    if (isOpen) {
      setIsBlocked(isBlockedInitial || false);
    }
  }, [isOpen, isBlockedInitial]);

  if (!isOpen) return null;

  const handleBlockToggle = async () => {
    const oldState = isBlocked;
    const newState = !oldState;
    setIsBlocked(newState);

    if (!userId) {
      setIsBlocked(oldState);
      alert("Error: User ID is missing!");
      return;
    }

    const action = newState ? "block" : "unblock";

    try {
      const res = await fetch(`/api/users/${action}/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update block status");
      }
    } catch (error) {
      setIsBlocked(oldState);
      alert(`ไม่สามารถทำรายการได้: ${error.message}`);
    }
  };

  const handleReportSelect = async (reason) => {
    console.log("📩 Report sent:", reason);
    
    try {
      // ✅ ใช้ username สำหรับ Report (ตาม Backend Route: /<username>/report)
      if (!username) {
          alert("Error: Username is missing for report!");
          return;
      }

       const res = await fetch(`/api/users/${username}/report`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: reason,
          description: otherReason
        })
      });

      if (res.ok) {
        alert("ขอบคุณสำหรับการรายงาน ทีมงานจะตรวจสอบโดยเร็วที่สุด");
        setShowReportReasons(false);
        setOtherReason("");
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาดในการส่งรายงาน");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  };

  const handleOtherSubmit = (e) => {
    e.preventDefault();
    if (otherReason.trim()) {
      handleReportSelect(`Other: ${otherReason}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative bg-white border border-black rounded-2xl 
          w-[480px] sm:w-[420px] max-h-[80vh] 
          p-8 flex flex-col items-center text-center overflow-y-auto
          font-['Anuphan']
        "
      >
        {/* Close Button */}
        <button
          onClick={() => {
            if (showReportReasons) setShowReportReasons(false);
            else onClose();
          }}
          className="absolute left-4 top-4 text-black hover:opacity-70 transition"
        >
          <X className="w-7 h-7" />
        </button>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-semibold mb-6 mt-2">
          {showReportReasons ? "Report user" : "Profile options"}
        </h2>

        {/* View 1: Block / Report */}
        {!showReportReasons ? (
          <div className="flex justify-center gap-6 mt-4">
            <button
              onClick={handleBlockToggle}
              className={`px-8 py-3 rounded-xl border transition text-base font-medium ${
                isBlocked
                  ? "bg-[#D35400] border-black text-black"
                  : "border-[#D35400] text-black hover:bg-gray-50"
              }`}
            >
              {isBlocked ? "Unblock" : "Block"}
            </button>

            <button
              onClick={() => setShowReportReasons(true)}
              className="px-8 py-3 rounded-xl border border-[#D35400] text-black text-base font-medium hover:bg-gray-50"
            >
              Report
            </button>
          </div>
        ) : (
          <>
            {/* Report Reasons */}
            <div className="flex flex-col gap-3 text-left w-full">
              {[
                {
                  title: "Inappropriate Content",
                  desc: "Contains unsuitable material (e.g., offensive language, violent imagery, sexually explicit content).",
                },
                {
                  title: "Spam or Misleading",
                  desc: "Project is spam, hidden advertising, or intentionally misleading.",
                },
                {
                  title: "Plagiarism",
                  desc: "Infringes copyright or copies another person’s work without permission.",
                },
                {
                  title: "Offensive or Harmful",
                  desc: "Promotes discrimination, hate speech, or harmful behavior toward individuals or groups.",
                },
                {
                  title: "Incorrect Category",
                  desc: "Posted under the wrong category or uses the project space for unrelated content.",
                },
              ].map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleReportSelect(r.title)}
                  className="w-full border border-[#D35400] text-left rounded-xl p-3 hover:bg-[#fff2ea] transition"
                >
                  <p className="font-semibold text-black">{r.title}</p>
                  <p className="text-sm text-gray-700">{r.desc}</p>
                </button>
              ))}

              {/* Other Reason */}
              <form
                onSubmit={handleOtherSubmit}
                className="border border-[#D35400] rounded-xl p-3 mt-3"
              >
                <label className="font-semibold text-black block mb-2">
                  Other
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Please specify your reason"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className="flex-1 rounded-lg px-3 py-2 text-black border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#D35400]"
                  />
                  <button
                    type="submit"
                    className="bg-[#D35400] text-white font-semibold rounded-lg px-4 py-2 hover:bg-[#c84f00] transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
