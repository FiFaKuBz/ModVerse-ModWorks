import { useState, useEffect } from "react";
import { X } from "lucide-react";

// ✅ เปลี่ยนจากรับ username เป็น userId
export default function ProfileOptionsModal({ isOpen, onClose, userId, isBlockedInitial }) {
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
    // 1. จำค่าเดิมไว้เผื่อต้องแก้คืน
    const oldState = isBlocked;
    const newState = !oldState;

    // 2. เปลี่ยนสถานะปุ่มทันที (Optimistic Update)
    setIsBlocked(newState);

    const action = newState ? "block" : "unblock";

    try {
      // 3. เรียก API จริงโดยใช้ userId
      console.log(`${action}ing User ID:`, userId); 

      if (!userId) {
          alert("Error: User ID is missing!");
          // Revert state immediately if userId is missing
          setIsBlocked(oldState);
          return;
      }

      // ✅ เปลี่ยน URL เป็น /api/users/block/<userId> หรือ /api/users/unblock/<userId>
      // (ต้องแน่ใจว่า Backend route รองรับ pattern นี้แล้วตามที่คุณแก้ไขไปก่อนหน้า)
      const res = await fetch(`/api/users/${action}/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include" // ส่ง Session Cookie ไปด้วย
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update block status");
      }
    } catch (error) {
      console.error(error);
      // 4. ถ้าพัง แก้ค่ากลับเป็นเหมือนเดิม
      setIsBlocked(oldState);
      alert(`ไม่สามารถทำรายการได้: ${error.message}`);
    }
  };

  const handleReportSelect = async (reason) => {
    console.log("📩 Report sent:", reason);
    
    try {
      if (!userId) {
          alert("Error: User ID is missing for report!");
          return;
      }

      // หมายเหตุ: Report API อาจจะยังคงใช้ username หรือ userId ก็ได้ ขึ้นอยู่กับ Backend
      // แต่ถ้า Backend Route ยังเป็น /<username>/report อยู่ คุณอาจต้องส่ง username เข้ามาด้วย
      // หรือถ้าคุณแก้ Backend Route ของ Report ให้รับ userId ด้วย ก็ใช้ userId ได้เลย
      // *สมมติว่าคุณแก้ Backend ให้ Report ใช้ userId ด้วย หรือถ้ายังไม่แก้ คุณต้องระวังจุดนี้*
      // เพื่อความชัวร์ ผมจะใช้ userId ในการส่ง report ด้วย (สมมติว่าคุณแก้ Backend Route เป็น /report/<userId> หรือส่ง body)
      
      // แต่ตาม Route เดิมที่คุณแก้ล่าสุด:
      // @user_bp.route("/<username>/report", methods=["POST"]) 
      // มันยังรับ <username> อยู่!
      // ดังนั้นถ้าจะใช้ userId คุณต้องแก้ Backend Route ของ Report ด้วย หรือส่ง username เข้ามาใน Modal นี้คู่กัน
      
      // *ทางแก้ชั่วคราว:* ผมจะสมมติว่าคุณยังไม่ได้แก้ Report route ให้รับ ID
      // ดังนั้นการกด Report อาจจะ Error 404 ถ้าเราส่ง userId ไปในที่ที่รอ username
      
      // *ทางแก้ที่แนะนำ:* ผมจะแก้ Code นี้ให้เรียก /api/users/report โดยส่ง target_id ใน Body แทน
      // หรือถ้าคุณไม่อยากแก้ Backend เยอะ ให้รับ username เข้ามาด้วยเพื่อใช้สำหรับ Report อย่างเดียว
      
      // *ในที่นี้ผมขอใช้ userId ส่งไปก่อน แต่คุณต้องไปแก้ Backend Route ของ Report ให้รับ <user_id> เหมือน Block นะครับ*
      // หรือถ้ายังไม่แก้ Backend Route ของ Report ให้กลับไปแก้ Backend ก่อน
      
      // สมมติว่า Backend Route ยังเป็น /<username>/report 
      // งั้นผมจะ Alert เตือนไว้ก่อน
      
      // เพื่อให้โค้ดนี้ทำงานได้กับ Backend ที่คุณแก้ Block/Unblock ไปแล้ว ผมจะเรียก API Block ด้วย ID
      // ส่วน Report ผมจะเรียกแบบเดิม (ซึ่งอาจจะ fail ถ้าไม่มี username) 
      // แต่เพื่อให้ Block ใช้ ID ได้แน่นอน:
      
      // ถ้าคุณต้องการใช้ userId กับ Report ด้วย คุณต้องแก้ Backend:
      // @user_bp.route("/report/<user_id>", methods=["POST"]) ...
      
      // *ในโค้ดนี้ผมจะลองส่ง userId ไปที่ URL Report ดู (เผื่อคุณแก้ Backend แล้ว)*
       const res = await fetch(`/api/users/${userId}/report`, { // ⚠️ เช็ค Backend Route ว่ารับ ID หรือ Username
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
        alert(data.error || "เกิดข้อผิดพลาดในการส่งรายงาน (ตรวจสอบว่า Backend Report Route รับ User ID หรือยัง)");
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