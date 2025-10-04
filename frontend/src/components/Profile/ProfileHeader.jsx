export default function ProfileHeader({ profile }) {
  return (
    <div className="flex flex-col items-center mt-12 px-4">
      {/* Avatar */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-mGrey flex items-center justify-center overflow-hidden">
        {profile?.avatar ? (
          <img src={profile.avatar} alt="profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-xs sm:text-sm">NO IMG</span>
        )}
      </div>

      {/* Username + Info */}
      <h2 className="mt-3 text-2xl sm:text-lg md:text-xl font-semibold text-mOrange truncate max-w-[90%] text-center font-bold">
        {profile?.username || "Username"}
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-black truncate max-w-[90%] text-center font-normal">
        {profile?.description || "description"}
      </p>
      <p className="text-xs sm:text-sm text-black truncate max-w-[90%] text-center font-normal">
        {profile?.email || "Email@gmail.com"}
      </p>
    </div>
  );
}
