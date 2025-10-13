import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed left-2 p-2 rounded-full hover:bg-gray-100"
    >
      <ChevronLeft className="w-12 h-12" />
    </button>
  );
}
