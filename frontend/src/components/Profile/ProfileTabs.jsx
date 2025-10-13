export default function ProfileTabs({
  activeTab,
  setActiveTab,
  isOwner = true,
  showSavedPublicly = true,
}) {
  const tabs = [
    "Created",
    ...(isOwner || showSavedPublicly ? ["Saved"] : []),
    ...(isOwner ? ["Recruiter Requests"] : []),
  ];

  return (
    <div className="flex justify-center mt-4 gap-[37px] text-[16px] sm:text-[18px] md:text-[20px] font-['Anuphan']">
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
