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
import { listProjects } from "../api/projects";
import { getProfile } from "../api/profile";

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙\s-]/g, "")
    .replace(/\s+/g, "-");

const normalizeCoauthors = (list = []) =>
  (list || [])
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        const name = item.trim();
        if (!name) return null;
        return { name, slug: slugify(name) };
      }
      const name = item.name?.trim() || "";
      if (!name) return null;
      return { name, slug: item.slug || slugify(name) };
    })
    .filter(Boolean);

const SAMPLE_CREATED = [
  // { id: "demo-ui-system", title: "UI System", contributor: "Jane", tags: ["UX/UI", "Database"], image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=800&q=80" },
  // { id: "demo-cloud-engine", title: "Cloud Engine", contributor: "John", tags: ["Algorithm", "Database"], image: "" },
  // { id: "demo-smart-car", title: "Smart Car", contributor: "Alex", tags: ["Transportation", "Digital Circuit"], image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80" },
  // { id: "demo-circuit-analyzer", title: "Circuit Analyzer", contributor: "Mia", tags: ["Digital Circuit", "Algorithm"], image: "https://images.unsplash.com/photo-1593642532871-8b12e02d091c?auto=format&fit=crop&w=800&q=80" },
  // { id: "demo-urban-mobility", title: "Urban Mobility Planner", contributor: "Liam", tags: ["Transportation", "UX/UI"], image: "https://ceo-na.com/wp-content/uploads/2019/01/urban-mobility.jpeg" },
  // { id: "demo-data-viz", title: "Data Visualization Hub", contributor: "Ella", tags: ["Database", "UX/UI"], image: "https://editor.analyticsvidhya.com/uploads/805881.1.png" },
  // { id: "demo-edge-mapper", title: "Edge Mapper", contributor: "Kai", tags: ["Algorithm"], image: "" },
  // { id: "demo-city-twins", title: "City Twins", contributor: "May", tags: ["UX/UI"], image: "" },
  // { id: "demo-path-planner", title: "Path Planner", contributor: "Neo", tags: ["Transportation"], image: "" },
  // { id: "demo-sensor-fusion", title: "Sensor Fusion", contributor: "Ivy", tags: ["Digital Circuit"], image: "" },
];

const SAMPLE_SAVED = [
  // { id: "demo-ai-diagnostic", title: "AI Diagnostic Assistant", contributor: "Noah", tags: ["Algorithm", "Digital Circuit"], image: "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=800&q=80" },
  // { id: "demo-smart-traffic", title: "Smart Traffic Dashboard", contributor: "Ava", tags: ["Transportation", "Database", "UX/UI"], image: "https://optraffic.com/wp-content/uploads/2024/06/Traffic-Congestion-1200-900-1024x768.jpg" },
];

const FALLBACK_PROFILE = {
  avatar: "",
  username: "Username",
  description: "description",
  email: "Email@gmail.com",
  followers: 0,
  following: 0,
  likes: 0,
  showSavedPublicly: true,
};

const SAVED_KEY = "mv_saved_projects";

const readSavedProjects = () => {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const pickSavedIds = (profile) => {
  const ids = profile?.saved_projects || profile?.savedProjects || [];
  return Array.isArray(ids) ? ids.map((v) => String(v)) : [];
};

export default function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
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
    let canceled = false;
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        if (!canceled && data) {
          setProfile(data);
        }
      } catch {
        if (!canceled) setProfile(FALLBACK_PROFILE);
      } finally {
        if (!canceled) setProfileLoading(false);
      }
    };
    loadProfile();
    return () => {
      canceled = true;
    };
  }, []);

  const resolvedProfile = profile || FALLBACK_PROFILE;
  const profileUsername = resolvedProfile.username || "";

  useEffect(() => {
    let canceled = false;
    const fetchData = async () => {
      const fallbackContributor = profileUsername || FALLBACK_PROFILE.username;
      const ownerSlug = slugify(profileUsername);
      const savedIds = pickSavedIds(profile);
      try {
        const remote = await listProjects();
        if (canceled) return;
        const dataset = Array.isArray(remote) ? remote : [];
        const matched = dataset
          .filter((item) => {
            if (!item) return false;
            const contributorSlug = slugify(item.contributor || "");
            if (contributorSlug === ownerSlug) return true;
            return normalizeCoauthors(item.coauthors).some((co) => co.slug === ownerSlug);
          })
          .map((item) => ({
            id: item.id,
            title: item.title,
            contributor: item.contributor || fallbackContributor,
            tags: item.tags || [],
            image: item.image || "",
          }));

        const seen = new Set();
        const combined = [...matched, ...SAMPLE_CREATED].filter((proj) => {
          const key = proj.id || `${proj.title}-${proj.contributor}`;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setProjects(combined);

        // Saved projects: prefer backend saved IDs, fall back to local cache
        const savedList =
          savedIds.length > 0
            ? dataset.filter((p) => savedIds.includes(String(p.id)))
            : readSavedProjects();
        setSavedProjects(savedList);
      } catch {
        if (!canceled) {
          setProjects(SAMPLE_CREATED);
          setSavedProjects(savedIds.length ? [] : readSavedProjects());
        }
      }
    };
    fetchData();
    return () => {
      canceled = true;
    };
  }, [profileUsername]);

  // Dataset by tab
  const list = activeTab === "Saved" ? savedProjects : projects;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        กำลังโหลดโปรไฟล์...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white text-gray-900 font-['Anuphan']">
      <BackButton />

      <div className="w-full max-w-[1600px] mx-auto px-[clamp(1rem,4vw,5rem)]">
        <ProfileHeader profile={resolvedProfile} />

        <ProfileStats
          followers={resolvedProfile.followers}
          following={resolvedProfile.following}
          onShare={() => setIsShareOpen(true)}
          onEdit={() => navigate("/edit-profile")}
        />

        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOwner={true}
          showSavedPublicly={resolvedProfile.showSavedPublicly}
          showRecruiter={false}
        />

        <div className="mt-8 pt-8 border-t border-transparent">
          {/* ✅ center each card AND the grid block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(3,292px)] gap-y-[59px] gap-x-2 justify-center mx-auto">
            {pageItems.length ? (
              pageItems.map((project, i) => (
                <ProjectCard key={project.id || `${project.title}-${i}`} project={project} isOwner />
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
