// src/pages/OtherProfilePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import BackButton from "../components/common/BackButton";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileStats from "../components/Profile/ProfileStats";
import ProfileTabs from "../components/Profile/ProfileTabs";
import ProjectCard from "../components/Profile/ProjectCard";
import ShareModal from "../components/common/ShareModal";
import Pagination from "../components/common/Pagination"; 
import { listProjects } from "../api/projects";
import { getProfileBySlug } from "../api/profile";

const toSlug = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙\s-]/g, "")
    .replace(/\s+/g, "-");

const normalizeCoauthors = (list = []) =>
  list
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        const name = item.trim();
        if (!name) return null;
        return { name, slug: toSlug(name) };
      }
      const name = item.name?.trim() || "";
      if (!name) return null;
      return { name, slug: item.slug || toSlug(name) };
    })
    .filter(Boolean);

const SAMPLE_OTHER_CREATED = [];
const SAMPLE_OTHER_SAVED = [];

export default function OtherProfilePage() {
  const { username } = useParams(); // e.g. /profile/lara-cooper

  const fallbackProfile = {
    avatar: "",
    username: username ? username.replace(/-/g, " ") : "User",
    description: "",
    followers: 0,
    following: 0,
    likes: 0,
    showSavedPublicly: true,
    isFollowing: false,
    isBlocked: false,
  };
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [savedProjects, setSavedProjects] = useState([]);
  // --- UI state ---
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Created");

  // --- Pagination (9 per page) ---
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  const [remoteProjects, setRemoteProjects] = useState([]);

  useEffect(() => {
    let canceled = false;
    const loadProfile = async () => {
      if (!username) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      try {
        const data = await getProfileBySlug(username);
        if (!canceled && data) {
          setProfile(data);
        }
      } catch {
        if (!canceled) setProfile(null);
      } finally {
        if (!canceled) setProfileLoading(false);
      }
    };
    loadProfile();
    return () => {
      canceled = true;
    };
  }, [username]);

  useEffect(() => {
    let canceled = false;
    const loadProjects = async () => {
      try {
        const list = await listProjects();
        if (canceled) return;
        setRemoteProjects(Array.isArray(list) ? list : []);

        // Prep for backend support: attempt saved fetch when available
        if (username && profile?.showSavedPublicly !== false) {
          try {
            const res = await fetch(`/api/users/${username}/saved`, { credentials: "include" });
            if (!res.ok) throw new Error("saved endpoint unavailable");
            const data = await res.json();
            if (Array.isArray(data?.projects)) setSavedProjects(data.projects);
          } catch {
            setSavedProjects([]);
          }
        } else {
          setSavedProjects([]);
        }
      } catch {
        if (!canceled) setRemoteProjects([]);
      }
    };
    loadProjects();
    return () => {
      canceled = true;
    };
  }, [username, profile?.showSavedPublicly]);

  const createdProjects = useMemo(() => {
    if (!username) return SAMPLE_OTHER_CREATED;
    const matches = remoteProjects
      .filter((project) => {
        if (!project) return false;
        const ownerSlug = toSlug(project.contributor || "");
        if (ownerSlug === username) return true;
        return normalizeCoauthors(project.coauthors).some((co) => co.slug === username);
      })
      .map((project) => ({
        id: project.id,
        title: project.title,
        contributor: project.contributor || "Unknown",
        tags: project.tags || [],
        image: project.image || "",
      }));

    const seenIds = new Set();
    const combined = [...matches, ...SAMPLE_OTHER_CREATED].filter((project) => {
      const key = project.id || `${project.title}-${project.contributor}`;
      if (!key || seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    });

    return combined;
  }, [remoteProjects, username]);

  // reset to first page when tab/data changes
  useEffect(() => setPage(1), [activeTab, createdProjects.length, savedProjects.length]);

  // choose dataset based on tab
  const list = activeTab === "Saved" ? savedProjects : createdProjects;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);
  const resolvedProfile = profile || fallbackProfile;

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
        {/* Profile header */}
        <ProfileHeader profile={resolvedProfile} />

        {/* Stats & Actions */}
        <ProfileStats
          followers={resolvedProfile.followers}
          following={resolvedProfile.following}
          likes={resolvedProfile.likes || resolvedProfile.total_likes || 0}
          showLikes
          showEdit={false}
          showFollow
          showMenu
          onShare={() => setIsShareOpen(true)}
          
          // [FIX] Pass username and initial status for Follow logic
          username={resolvedProfile.username}
          userId={resolvedProfile._id}
          isFollowingInitial={resolvedProfile.isFollowing}

          isBlockedInitial={resolvedProfile.isBlocked}
        />

        {/* Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOwner={false}
          showSavedPublicly={resolvedProfile.showSavedPublicly}
          showRecruiter={false}
        />

        {/* Grid */}
        <div className="mt-8 pt-8 border-t border-transparent">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(3,292px)] gap-y-[59px] gap-x-2 justify-center mx-auto">
            {pageItems.length ? (
              pageItems.map((project, idx) => (
                <ProjectCard key={project.id || `${project.title}-${idx}`} project={project} isOwner={false} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-400">
                No projects yet.
              </p>
            )}
          </div>

          {/* Pagination */}
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

      {/* Share (profile) */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        type="profile"
      />
    </div>
  );
}