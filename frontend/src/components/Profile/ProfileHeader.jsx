export default function ProfileHeader({ profile }) {
  return (
    <div className="flex flex-col items-center mt-12 px-4 text-center font-['Anuphan']">
      {/* Avatar */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-mGrey flex items-center justify-center overflow-hidden">
        {profile?.avatar ? (
          <img
            src={profile.avatar}
            alt="profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-xs sm:text-sm">NO IMG</span>
        )}
      </div>

      {/* Username */}
      <h2 className="mt-3 text-[24px] sm:text-[26px] md:text-[28px] font-At font-semibold text-mOrange truncate max-w-[90%]">
        {profile?.username || "Username"}
      </h2>

      {/* Description / Bio */}
      <p className="text-[14px] sm:text-[16px] md:text-[18px] font-IBM text-black truncate max-w-[90%]">
        {profile?.description || "description"}
      </p>

      {/* Email (only visible for self-view) */}
      {profile?.email && (
        <p className="text-xs sm:text-sm font-IBM text-black truncate max-w-[90%] opacity-80">
          {profile.email}
        </p>
      )}
    </div>
  );
}
