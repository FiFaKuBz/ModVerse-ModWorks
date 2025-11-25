export default function ProfileHeader({ profile }) {
  return (
    <div className="flex flex-col items-center mt-12 px-4 text-center font-['Anuphan']">
      {/* Avatar */}
      <div className="w-[100px] h-[100px] rounded-full bg-mGrey flex items-center justify-center overflow-hidden">
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
      <h2 className="mt-3 text-[20px] sm:text-[22px] md:text-[24px] font-At font-semibold text-mOrange truncate max-w-[90%]">
        {profile?.username || "Username"}
      </h2>

      {/* Description / Bio */}
      <p className="text-[10px] sm:text-[12px] md:text-[14px] font-IBM text-black truncate max-w-[90%]">
        {profile?.about || profile?.description || "No description provided"}
      </p>

      {/* Email (only visible for self-view) */}
      {profile?.email && (
        <p className="text-[10px] sm:text-[12px] md:text-[14px] font-IBM text-black truncate max-w-[90%]">
          {profile.email}
        </p>
      )}
    </div>
  );
}
