import { useState, useEffect } from "react";
import CustomButton from "../common/CustomButton";
import { Menu } from "lucide-react";
import ProfileOptionsModal from "../common/ProfileOptionsModal";
import { useNavigate } from "react-router-dom";
import { followUser, unfollowUser } from "../../api/profile";

export default function ProfileStats({
  followers = 0,
  following = 0,
  likes,
  showEdit = true,
  showLikes = false,
  showFollow = false,
  showMenu = false,
  onShare, // passed from ProfilePage
  onEdit,  // passed from ProfilePage
  username,
  userId,
  isFollowingInitial = false,
  isBlockedInitial = false,
  onBlockChange,
}) {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [followerCount, setFollowerCount] = useState(followers);
  
  const [isLoading, setIsLoading] = useState(false);

  // Update local state if prop changes
  useEffect(() => {
    setIsFollowing(isFollowingInitial);
  }, [isFollowingInitial]);

  useEffect(() => {
    setFollowerCount(followers);
  }, [followers]);

  const handleFollowToggle = async () => {
    if (isLoading) return;
    if (!username) {
      alert("ชื่อผู้ใช้ไม่ถูกต้อง");
      return;
    }
    setIsLoading(true);

    // Optimistic toggle
    const oldState = isFollowing;
    setIsFollowing(!oldState);
    setFollowerCount((prev) => prev + (oldState ? -1 : 1));

    let success;
    if (oldState) {
        success = await unfollowUser(username);
    } else {
        success = await followUser(username);
    }

    if (!success) {
        // Revert if API fails
        setIsFollowing(oldState);
        setFollowerCount((prev) => prev + (oldState ? 1 : -1));
        alert("Action failed");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center mt-4 px-4 text-center font-An">
      {/* Followers / Following */}
      <div className="flex flex-wrap justify-center gap-2 text-[14px] sm:text-[16px] md:text-[18px] text-black font-semibold">
        <p>
          {followerCount} followers | {following} following
        </p>
      </div>

      {/* Likes */}
      {showLikes && (
        <p className="text-[14px] sm:text-[16px] md:text-[18px] text-black mt-1 text-center font-An">
          {likes} Likes
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-[37px] mt-4 flex-wrap justify-center relative text-[18px] sm:text-[16px] md:text-[14px] text-black mt-1 text-center font-medium font-IBM">
        {/* SHARE */}
        <CustomButton variant="share" onClick={onShare}>
          Share
        </CustomButton>

        {/* EDIT PROFILE */}
        {showEdit && (
          <CustomButton
            variant="edit"
            onClick={onEdit ? onEdit : () => navigate("/edit-profile")}
          >
            Edit Profile
          </CustomButton>
        )}

        {/* FOLLOW */}
        {showFollow && (
          <CustomButton
            variant="follow"
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`${
              isFollowing
                ? "bg-gray-200 text-black border border-gray-400 hover:bg-gray-300"
                : ""
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </CustomButton>
        )}

        {/* MENU (Other User Only) */}
        {showMenu && (
          <button
            onClick={() => setIsOptionsOpen(true)}
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

      {/* Profile Options Modal */}
      <ProfileOptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        username={username} 
        userId={userId}
        isBlockedInitial={isBlockedInitial}
        onBlockChange={onBlockChange}
      />
    </div>
  );
}

