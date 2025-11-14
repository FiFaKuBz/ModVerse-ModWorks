// src/components/common/CreateButton.jsx
import { Link } from "react-router-dom";
import createIcon from "../../../asset/create-button.svg";

export default function CreateButton({ to = "/create" }) {
  return (
    <Link
      to={to}
      aria-label="Create project"
      className="
        fixed bottom-6 right-6 z-50
        w-16 h-16 rounded-full
        bg-[#D35400] text-white
        shadow-md hover:brightness-110 active:scale-95
        grid place-items-center
        focus:outline-none focus:ring-2 focus:ring-black
        transition-transform
      "
    >
      <img
        src={createIcon}
        alt="Create"
        className="w-8 h-8 pointer-events-none"
      />
    </Link>
  );
}
