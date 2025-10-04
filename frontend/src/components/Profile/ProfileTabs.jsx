export default function ProfileTabs({ activeTab, setActiveTab }) {
  const tabs = ["Created", "Saved", "Recruiter Requests"];

  return (
    <div className="flex justify-center mt-6 gap-[37px] overflow-x-auto px-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className="relative px-1 pb-2 text-xs sm:text-sm md:text-base font-medium text-black whitespace-nowrap"
        >
          {tab}
          {activeTab === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-black rounded-full"></span>
          )}
        </button>
      ))}
    </div>
  );
}
