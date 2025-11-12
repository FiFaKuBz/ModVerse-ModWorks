export default function ProfileTabs({
  activeTab,
  setActiveTab,
  isOwner = true,
  showSavedPublicly = true,
  showRecruiter = false,
}) {
  const tabs = [
    "Created",
    ...(isOwner || showSavedPublicly ? ["Saved"] : []),
    ...(showRecruiter ? ["Recruiter Requests"] : []),
  ];

  return (
    <div className="flex justify-center mt-4 gap-[37px] text-[14px] sm:text-[16px] md:text-[18px] font-An">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`relative pb-2 transition-colors duration-200 ${
            activeTab === tab
              ? "font-semibold text-black after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
