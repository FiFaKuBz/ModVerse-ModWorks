import { useState } from "react";
import BackButton from "../components/common/BackButton";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileStats from "../components/Profile/ProfileStats";
import ProfileTabs from "../components/Profile/ProfileTabs";
import ProjectCard from "../components/Profile/ProjectCard";

export default function ProfilePage() {
  // --- Mock user data (will later come from backend) ---
  const profile = {
    avatar: "",
    username: "Username",
    description: "description", // this is the bio field
    email: "Email@gmail.com",
    followers: 0,
    following: 0,
    showSavedPublicly: true, // control visibility of Saved tab
  };

  // --- Created projects ---
  const projects = [
    {
      title: "UI System",
      contributor: "Jane",
      tags: ["UX/UI", "Database", "Transportation", "Digital Circuit", "Algorithm"],
      image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Cloud Engine",
      contributor: "John",
      tags: ["Algorithm", "Database"],
      image: "",
    },
    {
      title: "Smart Car",
      contributor: "Alex",
      tags: ["Transportation", "Digital Circuit"],
      image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Circuit Analyzer",
      contributor: "Mia",
      tags: ["Digital Circuit", "Algorithm"],
      image: "https://images.unsplash.com/photo-1593642532871-8b12e02d091c?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Urban Mobility Planner",
      contributor: "Liam",
      tags: ["Transportation", "UX/UI"],
      image: "https://ceo-na.com/wp-content/uploads/2019/01/urban-mobility.jpeg",
    },
    {
      title: "Data Visualization Hub",
      contributor: "Ella",
      tags: ["Database", "UX/UI"],
      image: "https://editor.analyticsvidhya.com/uploads/805881.1.png",
    },
  ];

  // --- Saved projects ---
  const savedProjects = [
    {
      title: "AI Diagnostic Assistant",
      contributor: "Noah",
      tags: ["Algorithm", "Digital Circuit"],
      image: "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Smart Traffic Dashboard",
      contributor: "Ava",
      tags: ["Transportation", "Database", "UX/UI"],
      image: "https://optraffic.com/wp-content/uploads/2024/06/Traffic-Congestion-1200-900-1024x768.jpg",
    },
  ];

  const recruiterRequests = [];

  // --- Tab logic ---
  const [activeTab, setActiveTab] = useState("Created");

  let projectsToShow = [];
  if (activeTab === "Created") projectsToShow = projects;
  else if (activeTab === "Saved") projectsToShow = savedProjects;
  else if (activeTab === "Recruiter Requests") projectsToShow = recruiterRequests;

  return (
    <div className="relative min-h-screen bg-white text-gray-900 font-['Anuphan']">
      {/* Back Button */}
      <BackButton />

      {/* Container */}
      <div className="w-full max-w-[1600px] mx-auto px-[clamp(1rem,4vw,5rem)]">
        {/* Profile Info */}
        <ProfileHeader profile={profile} />
        <ProfileStats
          followers={profile.followers}
          following={profile.following}
        />

        {/* Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOwner={true}
          showSavedPublicly={profile.showSavedPublicly}
        />

        {/* Divider for spacing */}
        <div className="mt-8 pt-8 border-t border-transparent">
          {/* Cards Grid */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              gap-[59px]
              justify-center
            "
          >
            {Array.isArray(projectsToShow) && projectsToShow.length > 0 ? (
              projectsToShow.map((project, idx) => (
                <ProjectCard key={idx} project={project} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-400">
                No projects yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
