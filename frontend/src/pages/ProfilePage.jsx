import { useState, useEffect } from "react";
import BackButton from "../components/common/BackButton";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileStats from "../components/Profile/ProfileStats";
import ProfileTabs from "../components/Profile/ProfileTabs";
import ProjectCard from "../components/Profile/ProjectCard";
import ShareModal from "../components/common/ShareModal";
import RecruiterRequestsTable from "../components/Profile/RecruiterRequestsTable";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();

  
  // --- Profile info (mock data; ready for backend) ---
  const [profile, setProfile] = useState({
    avatar: "",
    username: "Username",
    description: "description", // bio field
    email: "Email@gmail.com",
    followers: 0,
    following: 0,
    showSavedPublicly: true, // controls visibility of "Saved" tab
  });

  // --- Data states ---
  const [projects, setProjects] = useState([]);
  const [savedProjects, setSavedProjects] = useState([]);
  const [recruiterRequests, setRecruiterRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("Created");
  const [isShareOpen, setIsShareOpen] = useState(false);

  // --- Mock fetching (ready for backend integration) ---
  useEffect(() => {
    const fetchData = async () => {
      const userProjects = [
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

      const userSaved = [
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

      const recruiterList = [
        { name: "Username", email: "Email@gmail.com", date: "20/09/2025" },
        { name: "Username", email: "Email@gmail.com", date: "20/09/2025" },
        { name: "Username", email: "Email@gmail.com", date: "20/09/2025" },
        { name: "Username", email: "Email@gmail.com", date: "20/09/2025" },
        { name: "Username", email: "Email@gmail.com", date: "20/09/2025" },
        { name: "Username", email: "Email@gmail.com", date: "20/09/2025" },
      ];

      // Simulate network delay (remove later)
      await new Promise((res) => setTimeout(res, 300));

      setProjects(userProjects);
      setSavedProjects(userSaved);
      setRecruiterRequests(recruiterList);
    };

    fetchData();
  }, []);

  // --- Render content by active tab ---
  let content;
  if (activeTab === "Created") {
    content = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[59px] justify-center">
        {projects.length > 0 ? (
          projects.map((p, i) => <ProjectCard key={i} project={p} />)
        ) : (
          <p className="col-span-full text-center text-gray-400">No projects yet.</p>
        )}
      </div>
    );
  } else if (activeTab === "Saved" && profile.showSavedPublicly) {
    content = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[59px] justify-center">
        {savedProjects.length > 0 ? (
          savedProjects.map((p, i) => <ProjectCard key={i} project={p} />)
        ) : (
          <p className="col-span-full text-center text-gray-400">No saved projects yet.</p>
        )}
      </div>
    );
  } else if (activeTab === "Recruiter Requests") {
    content = <RecruiterRequestsTable requests={recruiterRequests} />;
  } else {
    content = <p className="text-center text-gray-400">Nothing to show.</p>;
  }

  // --- (Future) Backend sync handler placeholder ---
  const handleBackendSync = async (updatedData) => {
    try {
      console.log("📤 Syncing with backend...", updatedData);
      // Example:
      // await fetch(`/api/user/${profile.id}`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(updatedData),
      // });
    } catch (err) {
      console.error("❌ Backend sync failed:", err);
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-gray-900 font-['Anuphan']">
      {/* Back Button */}
      <BackButton />

      {/* Container */}
      <div className="w-full max-w-[1600px] mx-auto px-[clamp(1rem,4vw,5rem)]">
        <ProfileHeader profile={profile} />
        <ProfileStats
          followers={profile.followers}
          following={profile.following}
          onShare={() => setIsShareOpen(true)}
          onEdit={() => navigate("/edit-profile")} // Add this
        />

        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOwner={true}
          showSavedPublicly={profile.showSavedPublicly}
        />

        <div className="mt-8 pt-8 border-t border-transparent">{content}</div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        type="project"
      />
    </div>
  );
}
