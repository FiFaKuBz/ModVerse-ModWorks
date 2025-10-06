import CustomButton from "../common/CustomButton";
import { Menu } from "lucide-react";

export default function ProfileStats({
  followers = 0,
  following = 0,
  likes,
  showEdit = true,
  showLikes = false,
  showFollow = false,
  showMenu = false,
}) {
  return (
    <div className="flex flex-col items-center mt-4 px-4 text-center font-['Anuphan']">
      {/* Followers / Following / Likes */}
      <div className="flex flex-wrap justify-center gap-2 text-[16px] sm:text-[18px] md:text-[20px] text-black font-semibold">
        <p>
          {followers} followers | {following} following
        </p>
      </div>
      {showLikes && (
        <div className="mt-1">
        <p className="text-base sm:text-sm text-gray-700 mt-1 text-center font-medium">
          {likes} Likes
        </p>
      </div>)}

      {/* Buttons Row */}
      <div className="flex gap-[37px] mt-4 flex-wrap justify-center">
        <CustomButton variant="share">Share</CustomButton>

        {showEdit && <CustomButton variant="edit">Edit Profile</CustomButton>}

        {showFollow && <CustomButton variant="follow">Follow</CustomButton>}

        {showMenu && (
          <button
            className="
              absolute 
              right-[calc(50%-170px)] 
              translate-x-[200%]  
              w-10 h-15 
              flex items-center justify-center 
              hover:bg-gray-50 
              transition
            "
          >
            <Menu className="w-10 h-10 text-black" />
          </button>
        )}
      </div>
    </div>
  );
}
