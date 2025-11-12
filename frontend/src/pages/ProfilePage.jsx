// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../components/common/BackButton";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileStats from "../components/Profile/ProfileStats";
import ProfileTabs from "../components/Profile/ProfileTabs";
import ProjectCard from "../components/Profile/ProjectCard";
import ShareModal from "../components/common/ShareModal";
import Pagination from "../components/common/Pagination";

export default function ProfilePage() {
  const navigate = useNavigate();

  const [profile] = useState({
    avatar: "",
    username: "Username",
    description: "description",
    email: "Email@gmail.com",
    followers: 0,
    following: 0,
    showSavedPublicly: true,
  });

  const [projects, setProjects] = useState([]);
  const [savedProjects, setSavedProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("Created");
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Pagination
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the tab or dataset changes
  useEffect(() => setPage(1), [activeTab, projects.length, savedProjects.length]);

  useEffect(() => {
    const fetchData = async () => {
      const userProjects = [
        { title: "UI System", contributor: "Jane", tags: ["UX/UI", "Database"], image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=800&q=80" },
        { title: "Cloud Engine", contributor: "John", tags: ["Algorithm", "Database"], image: "" },
        { title: "Smart Car", contributor: "Alex", tags: ["Transportation", "Digital Circuit"], image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80" },
        { title: "Circuit Analyzer", contributor: "Mia", tags: ["Digital Circuit", "Algorithm"], image: "https://images.unsplash.com/photo-1593642532871-8b12e02d091c?auto=format&fit=crop&w=800&q=80" },
        { title: "Urban Mobility Planner", contributor: "Liam", tags: ["Transportation", "UX/UI"], image: "https://ceo-na.com/wp-content/uploads/2019/01/urban-mobility.jpeg" },
        { title: "Data Visualization Hub", contributor: "Ella", tags: ["Database", "UX/UI"], image: "https://editor.analyticsvidhya.com/uploads/805881.1.png" },
        { title: "Edge Mapper", contributor: "Kai", tags: ["Algorithm"], image: "" },
        { title: "City Twins", contributor: "May", tags: ["UX/UI"], image: "" },
        { title: "Path Planner", contributor: "Neo", tags: ["Transportation"], image: "" },
        { title: "Sensor Fusion", contributor: "Ivy", tags: ["Digital Circuit"], image: "" },
      ];

      const userSaved = [
        { title: "AI Diagnostic Assistant", contributor: "Noah", tags: ["Algorithm", "Digital Circuit"], image: "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=800&q=80" },
        { title: "Smart Traffic Dashboard", contributor: "Ava", tags: ["Transportation", "Database", "UX/UI"], image: "https://optraffic.com/wp-content/uploads/2024/06/Traffic-Congestion-1200-900-1024x768.jpg" },
      ];

      await new Promise((r) => setTimeout(r, 150));
      setProjects(userProjects);
      setSavedProjects(userSaved);
    };
    fetchData();
  }, []);

  // Dataset by tab
  const list = activeTab === "Saved" ? savedProjects : projects;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  return (
    <div className="relative min-h-screen bg-white text-gray-900 font-['Anuphan']">
      <BackButton />

      <div className="w-full max-w-[1600px] mx-auto px-[clamp(1rem,4vw,5rem)]">
        <ProfileHeader profile={profile} />

        <ProfileStats
          followers={profile.followers}
          following={profile.following}
          onShare={() => setIsShareOpen(true)}
          onEdit={() => navigate("/edit-profile")}
        />

        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOwner={true}
          showSavedPublicly={profile.showSavedPublicly}
          showRecruiter={false}
        />

        <div className="mt-8 pt-8 border-t border-transparent">
          {/* ✅ center each card AND the grid block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(3,292px)] gap-y-[59px] gap-x-2 justify-center mx-auto">
            {pageItems.length ? (
              pageItems.map((project, i) => (
                <ProjectCard key={`${project.title}-${i}`} project={project} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-400">
                {activeTab === "Saved" ? "No saved projects yet." : "No projects yet."}
              </p>
            )}
          </div>

          {/* ✅ use the correct props for your Pagination component */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                totalPages={totalPages}
                currentPage={safePage}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        type="project"
      />
    </div>
  );
}
