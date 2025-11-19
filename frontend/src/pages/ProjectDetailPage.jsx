// src/pages/ProjectDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import LandingHeader from "../components/Landing/LandingHeader";
import ProjectCard from "../components/Profile/ProjectCard";
import { getProject, listProjects } from "../api/projects";
import { getTopicDetailBg } from "../constants/topicColors";

const FALLBACK_RECOMMENDATIONS = [
  // {
  //   id: "fallback-urban",
  //   title: "Urban Mobility Planner",
  //   contributor: "Lara Cooper",
  //   tags: ["Transportation", "UX/UI"],
  //   image: "https://ceo-na.com/wp-content/uploads/2019/01/urban-mobility.jpeg",
  //   metrics7d: { likes: 42, saves: 18, comments: 6 },
  // },
  // {
  //   id: "fallback-visual",
  //   title: "Data Visualization Hub",
  //   contributor: "Pim",
  //   tags: ["Data Visualization", "Database"],
  //   image: "https://editor.analyticsvidhya.com/uploads/805881.1.png",
  //   metrics7d: { likes: 30, saves: 14, comments: 5 },
  // },
  // {
  //   id: "fallback-smartcar",
  //   title: "Smart Car",
  //   contributor: "Alex",
  //   tags: ["Transportation", "Digital Circuit"],
  //   image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80",
  //   metrics7d: { likes: 27, saves: 9, comments: 4 },
  // },
];

const score7d = (metrics = {}) => {
  const { likes = 0, saves = 0, comments = 0 } = metrics;
  return likes + saves * 2 + comments * 3;
};

const slugify = (value = "") =>
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
        return { name, slug: slugify(name) };
      }
      const name = item.name?.trim() || "";
      if (!name) return null;
      return { name, slug: item.slug || slugify(name) };
    })
    .filter(Boolean);

const pickRecommendedProjects = (currentId, tags = [], source = []) => {
  const dataset = Array.isArray(source)
    ? source.filter((p) => (p?.public ?? true) && p?.id !== currentId)
    : [];
  const pool = [...dataset, ...FALLBACK_RECOMMENDATIONS];
  const sharesTag = (item) => item.tags?.some((tag) => tags?.includes(tag));

  const ordered = [
    ...pool.filter(sharesTag).sort((a, b) => score7d(b.metrics7d) - score7d(a.metrics7d)),
    ...pool.filter((item) => !sharesTag(item)).sort((a, b) => score7d(b.metrics7d) - score7d(a.metrics7d)),
  ];

  const unique = [];
  const seen = new Set([currentId]);
  for (const item of ordered) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
    if (unique.length === 3) break;
  }
  return unique;
};

const DetailSection = ({ text, images }) => {
  if (!text) return null;

  return (
    <div className="mb-6">
      <p className="font-IBM text-[16px] leading-[20px] whitespace-pre-wrap">{text}</p>
      {images?.length ? (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((src, idx) => (
            <img key={idx} src={src} alt="" className="w-full rounded-lg object-cover" />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const CommentPanel = () => (
  <div className="w-full rounded-2xl bg-white p-5 text-sm text-neutral-600 shadow-sm xl:h-[184px] xl:w-[320px]">
    <h3 className="font-At text-[20px] font-semibold leading-[20px] mb-3">อยากพูดคุย ชื่นชม หรือแนะนำ?</h3>
    <div className="flex items-center gap-3 text-lg text-neutral-500 mb-4">
      <span role="img" aria-label="like">👍</span>
      <span role="img" aria-label="dislike">👎</span>
      <span role="img" aria-label="celebrate">🎉</span>
      <span role="img" aria-label="question">❓</span>
      <span role="img" aria-label="idea">💡</span>
    </div>
    <div className="rounded-md border border-neutral-300 px-3 py-4 text-[10px] font-IBM text-neutral-500">
      พื้นที่คอมเมนต์จะพัฒนาโดยทีมคอมเมนต์ในภายหลัง
    </div>
  </div>
);

const DetailColumn = ({
  project,
  detail,
  formattedDate,
  contributorName,
  contributorSlug,
  isOwner,
  onEdit,
  coauthors,
  showCoauthors,
  setShowCoauthors,
}) => (
  <article className="w-full rounded-2xl bg-white p-6 shadow-lg xl:w-[781px] xl:p-8">
    <h1 className="font-At text-[40px] leading-[45px] font-bold mb-4">{project.title}</h1>
    <div className="flex flex-wrap items-center gap-3 font-IBM text-xs text-neutral-600 mb-2">
      <span>
        {formattedDate} - by{" "}
        {isOwner ? (
          <Link to="/profile" className="hover:underline font-IBM">
            {contributorName}
          </Link>
        ) : (
          <Link to={`/profile/${contributorSlug}`} className="hover:underline font-IBM">
            {contributorName}
          </Link>
        )}
      </span>
      {coauthors.length > 0 && (
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-2 py-1 text-[11px] hover:bg-neutral-100"
            onClick={() => setShowCoauthors((v) => !v)}
          >
            ผู้ร่วมเขียน {coauthors.length} คน
            <span>{showCoauthors ? "▴" : "▾"}</span>
          </button>
          {showCoauthors && (
            <div className="absolute left-0 top-full mt-1 min-w-[220px] rounded-xl border bg-white p-3 shadow-lg z-10">
              <p className="text-[11px] text-neutral-500 mb-1">รายชื่อผู้ร่วมเขียน</p>
              <ul className="space-y-1 text-[12px] text-neutral-800">
                {coauthors.map((co, idx) => (
                  <li key={`${co.slug}-${idx}`} className="flex items-center gap-2">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black text-white text-[10px]">
                      {idx + 1}
                    </span>
                    <Link to={`/profile/${co.slug}`} className="hover:underline text-neutral-800">
                      {co.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
    <div className="mb-6 h-px w-full max-w-[528px] bg-black/70" />

    {detail.summary && (
      <p className="font-IBM text-[16px] leading-[20px] mb-6 whitespace-pre-wrap">{detail.summary}</p>
    )}

    <DetailSection text={detail.startPoint} images={detail.imagesBySection?.startPoint} />
    <DetailSection text={detail.goal} images={detail.imagesBySection?.goal} />
    <DetailSection text={detail.process} images={detail.imagesBySection?.process} />
    <DetailSection text={detail.result} images={detail.imagesBySection?.result} />
    <DetailSection text={detail.takeaway} images={detail.imagesBySection?.takeaway} />
    <DetailSection text={detail.nextStep} images={detail.imagesBySection?.nextStep} />

    <div className="mt-10 flex items-start gap-4 rounded-xl bg-[#F1E4E0] p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-300 text-lg font-semibold">
        {contributorName.slice(0, 1)}
      </div>
      <div className="flex-1">
        <div className="font-IBM text-xs text-neutral-600">Project Contributor</div>
        <div className="font-IBM font-semibold text-[17px] leading-[20px]">
          {isOwner ? (
            <Link to="/profile" className="hover:underline">
              {contributorName}
            </Link>
          ) : (
            <Link to={`/profile/${contributorSlug}`} className="hover:underline">
              {contributorName}
            </Link>
          )}
        </div>
        {project.tags?.length ? (
          <div className="mt-1 font-IBM text-xs text-neutral-700">
            สนใจใน {project.tags.join(", ")}
          </div>
        ) : null}
        {coauthors.length > 0 && (
          <div className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-neutral-700">
            <p className="font-semibold text-xs text-neutral-500 mb-1">ผู้ร่วมเขียน</p>
            <ul className="space-y-1 text-sm">
              {coauthors.map((co, idx) => (
                <li key={`${co.slug}-${idx}`} className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white text-[11px]">
                    {idx + 1}
                  </span>
                  <Link to={`/profile/${co.slug}`} className="hover:underline">
                    {co.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {isOwner && (
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#D35400] px-5 py-2 font-An text-white"
            onClick={onEdit}
          >
            แก้ไขโพสต์
          </button>
        )}
      </div>
    </div>
  </article>
);

const Sidebar = ({ recommended }) => (
  <aside className="flex w-full flex-col items-center gap-6">
    <CommentPanel />
    <div className="w-full rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-At text-[20px] font-semibold leading-[20px] mb-4">ดูงานอื่น ๆ ที่คล้ายกัน</h3>
      <div className="flex flex-col items-center gap-6">
        {recommended.map((item) => (
          <ProjectCard key={item.id} project={item} />
        ))}
      </div>
    </div>
  </aside>
);
export default function ProjectDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCoauthors, setShowCoauthors] = useState(false);
  const [project, setProject] = useState(location.state?.project || null);
  const [loading, setLoading] = useState(!location.state?.project);
  const [notFound, setNotFound] = useState(false);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    let canceled = false;
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const hydrate = async () => {
      setLoading(true);
      try {
        // Integration note: `getProject` is the canonical fetch; adjust that helper if backend schema shifts.
        const fetched = await getProject(id);
        if (canceled) return;
        if (!fetched) {
          setNotFound(true);
          setProject(null);
          return;
        }
        setNotFound(false);
        setProject(fetched);
      } catch {
        if (!canceled) setNotFound(true);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    hydrate();

    return () => {
      canceled = true;
    };
  }, [id]);

  useEffect(() => {
    let canceled = false;
    const fetchCatalog = async () => {
      try {
        // Integration note: catalog comes from `listProjects` so recommendations always share the same data source.
        const list = await listProjects();
        if (canceled) return;
        setCatalog(Array.isArray(list) ? list : []);
      } catch {
        if (!canceled) setCatalog([]);
      }
    };
    fetchCatalog();
    return () => {
      canceled = true;
    };
  }, []);

  const detail = project?.detail || {};
  const created = project?.createdAt ? new Date(project.createdAt) : null;
  const formattedDate = created
    ? created.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "";
  const contributorName = project?.contributor || "User";
  const contributorSlug = slugify(contributorName);
  const coauthorSource = project?.coauthors;
  const coauthors = useMemo(() => {
    const list = Array.isArray(coauthorSource) ? coauthorSource : [];
    return normalizeCoauthors(list);
  }, [coauthorSource]);

  useEffect(() => {
    setShowCoauthors(false);
  }, [coauthors.length]);
  const recommended = useMemo(() => {
    if (!project) return FALLBACK_RECOMMENDATIONS;
    return pickRecommendedProjects(project.id, project.tags || [], catalog);
  }, [project, catalog]);

  const primaryTag = project?.tags?.[0] || null;
  const primaryBg = getTopicDetailBg(primaryTag) || "#D3C2CD";
  const isOwner = useMemo(() => id?.startsWith("u-"), [id]);

  if (loading && !project) {
    return (
      <div className="min-h-screen bg-[#D3C2CD] text-gray-900">
        <LandingHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-700">
          กำลังโหลดโปรเจกต์...
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-[#D3C2CD] text-gray-900">
        <LandingHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-700">
          ไม่พบโปรเจกต์นี้
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900" style={{ backgroundColor: primaryBg }}>
      <LandingHeader />

      <div className="mx-auto w-full max-w-[1280px] px-4 xl:px-0">
        <div className="h-[256px] w-full overflow-hidden bg-neutral-200">
          {project.image && (
            <img src={project.image} alt={project.title} className="h-full w-full object-cover" />
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 xl:px-0">
        <div className="mx-auto flex w-full flex-col items-center gap-10 xl:flex-row xl:items-start xl:justify-start xl:gap-0">
          <div className="w-full xl:w-[781px] xl:ml-[94px] xl:-mt-16">
            <DetailColumn
              project={project}
              detail={detail}
              formattedDate={formattedDate}
              contributorName={contributorName}
              contributorSlug={contributorSlug}
              isOwner={isOwner}
              onEdit={() => navigate(`/edit-project/${id}`)}
              coauthors={coauthors}
              showCoauthors={showCoauthors}
              setShowCoauthors={setShowCoauthors}
            />
          </div>

          <div className="w-full xl:w-[320px] xl:ml-[35px] xl:mt-5">
            <Sidebar recommended={recommended} />
          </div>
        </div>
      </div>
    </div>
  );
}





