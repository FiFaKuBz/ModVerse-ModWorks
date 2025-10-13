import { useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../components/common/BackButton";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileStats from "../components/Profile/ProfileStats";
import ProfileTabs from "../components/Profile/ProfileTabs";
import ProjectCard from "../components/Profile/ProjectCard";

export default function OtherProfilePage() {
  const { username } = useParams(); // e.g., /profile/lara-cooper

  // --- Mock data (replace with backend fetch later) ---
  const userProfile = {
    avatar: "",
    username: username || "Lara Cooper",
    description: "interested in Data Visualization",
    followers: 100,
    following: 10,
    likes: 1000,
    showSavedPublicly: true, // controls visibility of Saved tab
  };

  // --- Projects (created & saved) ---
  const createdProjects = [
    {
      title: "Data Visualization Hub",
      contributor: "Lara Cooper",
      tags: ["UX/UI", "Database"],
      image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Urban Mobility Planner",
      contributor: "Lara Cooper",
      tags: ["Transportation", "UX/UI"],
      image: "https://ceo-na.com/wp-content/uploads/2019/01/urban-mobility.jpeg",
    },
  ];

  const savedProjects = [
    {
      title: "AI Diagnostic Assistant",
      contributor: "Noah",
      tags: ["Algorithm", "Digital Circuit"],
      image: "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=800&q=80",
    },
  ];

  // --- Tab logic ---
  const [activeTab, setActiveTab] = useState("Created");

  let projectsToShow = [];
  if (activeTab === "Created") projectsToShow = createdProjects;
  else if (activeTab === "Saved") projectsToShow = savedProjects;

  return (
    <div className="relative min-h-screen bg-white text-gray-900 font-['Anuphan']">
      {/* Back button */}
      <BackButton />

      {/* Page container */}
      <div className="w-full max-w-[1600px] mx-auto px-[clamp(1rem,4vw,5rem)]">
        {/* Profile info */}
        <ProfileHeader profile={userProfile} />

        {/* Stats & Buttons */}
        <ProfileStats
          followers={userProfile.followers}
          following={userProfile.following}
          likes={userProfile.likes}
          showLikes={true}
          showEdit={false}
          showFollow={true}
          showMenu={true}
        />

        {/* Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOwner={false}
          showSavedPublicly={userProfile.showSavedPublicly}
        />

        {/* Divider + Cards grid */}
        <div className="mt-8 pt-8 border-t border-transparent">
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
            {projectsToShow.length > 0 ? (
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
