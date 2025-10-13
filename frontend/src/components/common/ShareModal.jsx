import { Link } from "lucide-react";

export default function ShareModal({ isOpen, onClose, type = "profile" }) {
  if (!isOpen) return null;

  // Define modal text depending on type
  const content = {
    profile: {
      title: "Share profile link",
      description: "",
      subtext: "",
    },
    project: {
      title: "Find project inspiration together",
      description: "Share your project link",
      subtext:
        "Your friends need to follow you using your link to view your projects",
    },
  };

  const { title, description, subtext } = content[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={onClose}
    >
      <div
        className="
          bg-white rounded-xl shadow-md
          max-w-md w-[500px] sm:w-[460px] h-[324px]
          p-8 flex flex-col items-center justify-center
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-center text-lg sm:text-xl font-An font-semibold mb-4 text-black">
          {title}
        </h2>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <Link className="w-10 h-10 text-black" />
        </div>

        {/* Texts */}
        {description && (
          <p className="text-sm text-black font-IBM mb-1">{description}</p>
        )}
        {subtext && (
          <p className="text-center text-xs text-balck font-IBM mb-6">{subtext}</p>
        )}

        {/* Button */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
          }}
          className="
            bg-mOrange hover:bg-orange-700 
            border border-black 
            w-[149px] h-[57px]
            text-[14px] sm:text-[16px] md:text-[18px]
            text-Black font-medium font-IBM
            rounded-[20px] px-6 py-2 transition
          "
        >
          Copy link
        </button>
      </div>
    </div>
  );
}
