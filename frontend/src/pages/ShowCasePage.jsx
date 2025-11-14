// src/pages/ShowCasePage.jsx
import { useEffect, useMemo, useState } from "react";
import LandingHeader from "../components/Landing/LandingHeader";
import ProjectCard from "../components/Profile/ProjectCard";
import Pagination from "../components/common/Pagination";
import { useSearchParams } from "react-router-dom";
import CreateButton from "../components/common/CreateButton";

/* ---------- mock data + local user projects ---------- */
const STORAGE_KEY = "mv_user_projects";
function loadUserProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
const MOCK = [
  {
    id: "p1",
    title: "Data Visualization Hub",
    contributor: "Lara Cooper",
    tags: ["UX/UI", "Database", "Data Visualization"],
    image:
      "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?q=80&w=1000&auto=format&fit=crop",
    metrics7d: { likes: 42, saves: 21, comments: 6 },
  },
  {
    id: "p2",
    title: "MoodBoard AI",
    contributor: "Pim",
    tags: ["UX/UI", "Digital Circuit"],
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop",
    metrics7d: { likes: 12, saves: 9, comments: 3 },
  },
  ...Array.from({ length: 22 }).map((_, i) => ({
    id: "auto-" + i,
    title: "Project title",
    contributor: "Project Contributor",
    tags: ["UX/UI", "Transportation", "Algorithm", "Database", "Digital Circuit"].slice(
      0,
      1 + (i % 4)
    ),
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop",
    metrics7d: {
      likes: Math.floor(Math.random() * 60),
      saves: Math.floor(Math.random() * 35),
      comments: Math.floor(Math.random() * 12),
    },
  })),
];

const score7d = (m) => m.likes * 1 + m.saves * 2 + m.comments * 3;

// Topic chip color mapping (copied from TopicTray.jsx)
const tagColors = {
  "UX/UI": "bg-mPurple text-black",
  Transportation: "bg-mBlue text-black",
  Database: "bg-mYellow text-black",
  Algorithm: "bg-mGreen text-black",
  "Digital Circuit": "bg-mPink text-black",
  "Data Visualization": "bg-amber-200 text-black",
};

/* ------------------------------------------- */

export default function ShowcasePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const pageFromUrl = Number(searchParams.get("page") || 1);
  // Use a new search param 'topics' for multi-select
  const topicsParam = (searchParams.get("topics") || "all");

  const [page, setPage] = useState(pageFromUrl);
  // State is now an array of selected topics
  const [selectedTopics, setSelectedTopics] = useState(() => {
    if (topicsParam === "all") return [];
    // Split the comma-separated string from URL into an array
    return topicsParam.split(',').filter(t => t.trim() !== '');
  });

  // Build the full topic list from your data
  const ALL_TOPICS = useMemo(() => {
    const s = new Set();
    MOCK.forEach(p => p.tags?.forEach(t => s.add(t)));
    // ensure the common ones exist even if mock misses some
    ["UX/UI","Transportation","Database","Algorithm","Digital Circuit","Data Visualization"]
      .forEach(t => s.add(t));
    return Array.from(s).sort();
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    sp.set("page", String(page));
    // Store array as comma-separated string, or "all" if empty
    const topicParam = selectedTopics.length > 0 ? selectedTopics.join(',') : "all";
    sp.set("topics", topicParam);
    
    // Cleanup the old 'topic' parameter if it exists
    sp.delete("topic");

    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedTopics]);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, [page, selectedTopics]);

  const filteredSorted = useMemo(() => {
    const USER = loadUserProjects();
    const userCards = USER.filter((p) => p.public).map((p) => ({
      id: p.id,
      title: p.title,
      contributor: p.contributor || "You",
      tags: p.tags || [],
      image: p.image || "",
      metrics7d: p.metrics7d || { likes: 0, saves: 0, comments: 0 },
    }));
    const joined = [...userCards, ...MOCK];
    const base = topic === "all" ? joined : joined.filter(p => p.tags.includes(topic));
    // Determine if we should show ALL projects (if no topics selected OR all topics are selected)
    const isShowAll = selectedTopics.length === 0 || selectedTopics.length === ALL_TOPICS.length;

    if (isShowAll) {
      return [...MOCK].sort((a, b) => score7d(b.metrics7d) - score7d(a.metrics7d));
    }
    
    // Filter: project must include ALL selected topics (AND logic)
    const base = MOCK.filter(p => 
      // Check if p.tags exists and every selected tag is present in p.tags
      p.tags && selectedTopics.every(selectedTag => p.tags.includes(selectedTag))
    );
    return [...base].sort((a, b) => score7d(b.metrics7d) - score7d(a.metrics7d));
  }, [selectedTopics, ALL_TOPICS.length]);

  const PER_PAGE = 9;
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PER_PAGE;
  const pageItems = filteredSorted.slice(start, start + PER_PAGE);

  // New handler to toggle topics
  const handleTopicChange = (topicToToggle) => {
    setSelectedTopics(prevTopics => {
      let nextTopics;

      if (topicToToggle === "all") {
        // If "all" is clicked, clear all selections (which is equivalent to showing all projects).
        nextTopics = [];
      } else {
        // Existing toggle logic for specific topics
        const isSelected = prevTopics.includes(topicToToggle);
        
        if (isSelected) {
          // Remove topic
          nextTopics = prevTopics.filter(t => t !== topicToToggle);
        } else {
          // Add topic
          nextTopics = [...prevTopics, topicToToggle];
        }
      }
      
      // Reset page to 1 upon filter change
      setPage(1); 
      return nextTopics;
    });
  };

  const isShowAll = selectedTopics.length === 0 || selectedTopics.length === ALL_TOPICS.length;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingHeader
        topics={ALL_TOPICS}         // <-- pass the array
        selectedTopics={selectedTopics} // <-- current selection array
        onChangeTopic={handleTopicChange} // <-- new handler
      />

      <div className="mx-auto max-w-[1600px] px-[clamp(1rem,4vw,5rem)] py-8">
        {/* Display selected topics on the same line, aligned to the center */}
        <div className="flex items-center justify-center gap-2 mb-10 font-At">
          <h2 className="text-2xl font-semibold mt-4">
            {isShowAll ? "All Projects" : "Projects Filtered by:"}
          </h2>
          {selectedTopics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4"> 
              {selectedTopics.map(topic => (
                <div
                  key={topic}
                  className={`inline-flex items-center rounded-full px-2 py-1 text-base font-semibold border-black border ${
                    tagColors[topic] || "bg-gray-100 text-black"
                  }`}
                >
                  {topic}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- MODIFIED SECTION --- */}
        {/* Show grid + pagination IF NOT loading AND items exist */}
        {!isLoading && pageItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(3,292px)] gap-y-[59px] gap-x-[59px] justify-center mx-auto">
              {pageItems.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>

            <div className="mt-10">
              <Pagination totalPages={totalPages} currentPage={current} onChange={setPage} />
            </div>
          </>
        )}

        {/* Show message IF loading OR no items exist */}
        {(isLoading || pageItems.length === 0) && (
          <div className="py-20 font-IBM text-center text-gray-400">
            {isLoading
              ? "Give us a sec — we’re sorting through awesome projects right now! 🚀"
              : "Hmm, no projects found. Why not be the first to make one? 👀"}
          </div>
        )}
        {/* --- END MODIFIED SECTION --- */}

      </div>
      {/* Floating Create button */}
      <CreateButton />
    </div>
  );
}