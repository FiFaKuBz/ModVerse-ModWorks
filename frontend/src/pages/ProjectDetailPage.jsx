// src/pages/ProjectDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import LandingHeader from "../components/Landing/LandingHeader";
import ProjectCard from "../components/Profile/ProjectCard";
import { getProject, listProjects } from "../api/projects";
import { getTopicDetailBg } from "../constants/topicColors";
import { normalizeMetrics7d, pickCreatedAt, pickUpdatedAt, score7d } from "../utils/scoring";
import thumbsUpIcon from "../assets/ThumbsUp-icon.svg";
import thumbsDownIcon from "../assets/ThumbsDown-icon.svg";

const EMOTES = [
  { name: "like", icon: thumbsUpIcon, alt: "Like" },
  { name: "dislike", icon: thumbsDownIcon, alt: "Dislike" },
];

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
  const pool = [...dataset, ...FALLBACK_RECOMMENDATIONS].map((item) => ({
    ...item,
    metrics7d: normalizeMetrics7d(item.metrics7d),
    createdAt: pickCreatedAt(item),
    updatedAt: pickUpdatedAt(item),
  }));
  const sharesTag = (item) => item.tags?.some((tag) => tags?.includes(tag));

  const ordered = [
    ...pool
      .filter(sharesTag)
      .sort(
        (a, b) =>
          score7d(b.metrics7d, b.createdAt, b.updatedAt) -
          score7d(a.metrics7d, a.createdAt, a.updatedAt)
      ),
    ...pool
      .filter((item) => !sharesTag(item))
      .sort(
        (a, b) =>
          score7d(b.metrics7d, b.createdAt, b.updatedAt) -
          score7d(a.metrics7d, a.createdAt, a.updatedAt)
      ),
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

// Comment Input Box
const CommentPanel = ({ commentText, onCommentChange, onCommentSubmit, activeEmote, onEmoteClick }) => (
  <div className="mt-10 w-full rounded-2xl border border-[#D35400] bg-white p-6 text-sm text-neutral-600">
    <h3 className="font-At text-[20px] font-bold leading-[20px] mb-4 text-black">
      อยากพูดคุย ชื่นชม หรือแนะนำ?
    </h3>
    <div className="flex items-center gap-4 mb-4">
      {/* Emote rendering loop - Clickable icons */}
      {EMOTES.map(emote => {
        const isActive = activeEmote === emote.name;
        const stateClasses = isActive 
            ? 'opacity-100' // Fully visible when active
            : 'opacity-50 hover:opacity-100'; // Dim when inactive

        return (
          <button 
            key={emote.name}
            onClick={() => onEmoteClick(emote.name)}
            className="hover:scale-110 transition active:scale-95"
          >
            <img 
              src={emote.icon} 
              alt={emote.alt} 
              className={`h-8 w-auto ${stateClasses} ${emote.name === 'thumbsDown' ? 'transform rotate-180' : ''}`}
            />
          </button>
        );
      })}
    </div>
    
    <div className="relative mb-3">
      <textarea 
        placeholder="เขียนสิ่งที่อยากบอกตรงนี้ได้เลย!"
        value={commentText}
        onChange={(e) => onCommentChange(e.target.value)} 
        className="w-full h-[120px] rounded-xl border border-[#D35400] p-4 text-sm outline-none resize-none placeholder-gray-400 text-black focus:ring-1 focus:ring-[#D35400]"
      />
    </div>

    {/* Submit Button aligned to right */}
    <div className="flex justify-end">
      <button 
        onClick={onCommentSubmit}
        disabled={!commentText.trim()} // Disable if empty
        className={`font-An font-semibold text-base rounded-full px-8 py-2 transition active:scale-95 shadow-sm
          ${!commentText.trim() 
            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
            : "bg-[#D35400] text-white hover:brightness-110"
          }`
        }
      >
        ส่ง
      </button>
    </div>
  </div>
);

// Component: Display previous comments
const PreviousComments = ({ comments }) => {
    // State to track which comment the current user has reacted to (simulates API interaction)
    const [userReactions, setUserReactions] = useState({});

    const handleReactionClick = (commentIndex, reactionType) => {
        setUserReactions(prev => {
            const currentReaction = prev[commentIndex];
            if (currentReaction === reactionType) {
                // Toggle off
                return { ...prev, [commentIndex]: null };
            } else {
                // Toggle on new reaction (or change reaction)
                return { ...prev, [commentIndex]: reactionType };
            }
        });
    };

    return (
      <div className="mt-8 w-full space-y-6">
          {[...comments].reverse().map((comment, index) => {
              const commentIndex = comments.length - 1 - index; // Original index for state map
              const currentReaction = userReactions[commentIndex];

              return (
                  <div key={index} className="flex gap-4">
                      {/* Avatar Placeholder */}
                      <div 
                          className="w-[56px] h-[56px] rounded-full flex-shrink-0"
                          style={{ backgroundColor: comment.avatarColor || '#D9D9D9' }} 
                      ></div>
                      
                      <div className="flex-1 pt-1">
                        <div className="font-bold text-black text-lg font-At leading-tight">{comment.author}</div>
                        <p className="text-black font-IBM text-sm mt-1">
                          {comment.text}
                        </p>

                        {/* Clickable Reaction and Reply area */}
                        <div className="mt-2 inline-flex items-center gap-4">
                          
                          {/* Like Button */}
                          <button 
                              onClick={() => handleReactionClick(commentIndex, 'like')}
                              className={`flex items-center gap-1 text-sm transition ${currentReaction === 'like' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                              title="Like"
                          >
                              <img 
                                  src={thumbsUpIcon} 
                                  alt="👍" 
                                  className="h-4 w-auto cursor-pointer" 
                              />
                          </button>
                          
                          {/* Thumbs Down Button */}
                          <button 
                              onClick={() => handleReactionClick(commentIndex, 'dislike')}
                              className={`flex items-center gap-1 text-sm transition ${currentReaction === 'dislike' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                              title="Dislike"
                          >
                              <img 
                                  src={thumbsDownIcon} 
                                  alt="👎" 
                                  className="h-4 w-auto cursor-pointer transform rotate-180" 
                              /> 
                          </button>
                          
                          <button className="text-xs text-black underline font-IBM hover:text-gray-600">Reply</button>
                        </div>
                      </div>
                  </div>
              );
          })} 
      </div>
    );
};


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
  // Props for comment functionality
  commentText,
  onCommentChange, 
  onCommentSubmit,
  commentsList,
  // Pass Emote state/handler down
  activeEmote,
  onEmoteClick,
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

    {detail.topic && (
      <p className="font-IBM text-[16px] leading-[20px] mb-6 whitespace-pre-wrap">{detail.topic}</p>
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

    <CommentPanel 
      commentText={commentText} 
      onCommentChange={onCommentChange} 
      onCommentSubmit={onCommentSubmit} 
      activeEmote={activeEmote}
      onEmoteClick={onEmoteClick}
    />
    <PreviousComments comments={commentsList} />
  </article>
);


const Sidebar = ({ recommended }) => (
  <aside className="flex w-full flex-col items-center gap-6">
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
  
  // === Comment State ===
  const [newCommentText, setNewCommentText] = useState("");
  const [commentsList, setCommentsList] = useState([]); 
  const [activeEmote, setActiveEmote] = useState(null);

  const handleEmoteClick = (emoteName) => {
    // Toggle the active emote for the input box
    setActiveEmote(prev => prev === emoteName ? null : emoteName);
  };

  const handleCommentSubmit = () => {
    const text = newCommentText.trim();
    if (!text) return;
    
    const newComment = {
        author: LOGGED_IN_USER_MOCK.author,
        text: text,
        avatarColor: LOGGED_IN_USER_MOCK.avatarColor,
        reaction: activeEmote, 
    };

    // Add new comment to the list
    setCommentsList(prev => [...prev, newComment]);
    setNewCommentText(""); // Clear input field
    setActiveEmote(null); // Clear active emote after submitting
  };
  // =====================


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

  const topicOrder =
    (project?.categories && project.categories.length
      ? project.categories
      : project?.tags) || [];
  const primaryTag = topicOrder[0] || null;
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
              // Pass comment state and handlers
              commentText={newCommentText}
              onCommentChange={setNewCommentText}
              onCommentSubmit={handleCommentSubmit}
              commentsList={commentsList}
              // Pass Emote state/handler down
              activeEmote={activeEmote}
              onEmoteClick={handleEmoteClick}
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