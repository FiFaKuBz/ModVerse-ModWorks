import { useEffect, useMemo, useState } from "react";
import LandingHeader from "../components/Landing/LandingHeader";
import ProjectCard from "../components/Profile/ProjectCard";
import Pagination from "../components/common/Pagination";
import { useSearchParams } from "react-router-dom";

/* ---------- mock data (unchanged) ---------- */
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

/* ------------------------------------------- */

export default function ShowcasePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const pageFromUrl = Number(searchParams.get("page") || 1);
  const topicFromUrl = (searchParams.get("topic") || "all");

  const [page, setPage] = useState(pageFromUrl);
  const [topic, setTopic] = useState(topicFromUrl);

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
    sp.set("topic", topic);
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, topic]);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, [page, topic]);

  const filteredSorted = useMemo(() => {
    const base = topic === "all" ? MOCK : MOCK.filter(p => p.tags.includes(topic));
    return [...base].sort((a, b) => score7d(b.metrics7d) - score7d(a.metrics7d));
  }, [topic]);

  const PER_PAGE = 9;
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PER_PAGE;
  const pageItems = filteredSorted.slice(start, start + PER_PAGE);

  const handleTopicChange = (next) => {
    setTopic(next);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingHeader
        topics={ALL_TOPICS}       // <-- pass the array
        topic={topic}             // <-- current selection
        onChangeTopic={handleTopicChange}
      />

      <div className="mx-auto max-w-[1600px] px-[clamp(1rem,4vw,5rem)] py-8">
        {isLoading ? (
          <div className="py-20 text-center text-gray-400">Loading…</div>
        ) : pageItems.length ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[59px] justify-items-center mx-auto">
              {pageItems.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>

            <div className="mt-10">
              <Pagination totalPages={totalPages} currentPage={current} onChange={setPage} />
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-gray-400">No projects found.</div>
        )}
      </div>
    </div>
  );
}