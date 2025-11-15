import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LandingHeader from "../components/Landing/LandingHeader";
import { getProject, updateProject } from "../api/projects";
import { getTopicChipClass } from "../constants/topicColors";

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙\s-]/g, "")
    .replace(/\s+/g, "-");

const CATEGORY_OPTIONS = [
  "UX/UI",
  "Transportation",
  "Database",
  "Algorithm",
  "Digital Circuit",
  "Data Visualization",
];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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

function ImagePicker({ label = "+ เพิ่มรูปภาพ", value = [], onChange, max = 6 }) {
  const handleFiles = async (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    const dataUrls = await Promise.all(arr.map(fileToDataUrl));
    const next = [...value, ...dataUrls].slice(0, max);
    onChange(next);
  };

  const handleInputChange = async (event) => {
    const { files } = event.target;
    if (!files?.length) return;
    try {
      await handleFiles(files);
    } finally {
      event.target.value = "";
    }
  };

  const removeAt = (idx) => {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="mt-2">
      <label className="mv-btn inline-flex items-center gap-2 text-sm text-[#D35400] font-semibold cursor-pointer">
        <input
          type="file"
          accept="image/*"
          multiple={max !== 1}
          className="sr-only"
          onChange={handleInputChange}
        />
        {label}
      </label>

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {value.map((src, i) => (
            <div
              key={`${i}-${src.slice(0, 12)}`}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300"
              title={`image-${i + 1}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 rounded-md bg-black/60 text-white text-xs px-1.5 py-0.5 hover:bg-black"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="mt-1 text-xs text-gray-500">รองรับภาพสูงสุด {max} รูป (JPG/PNG/GIF)</p>
    </div>
  );
}

const SECTION_LABELS = {
  startPoint: "จุดเริ่มต้น",
  goal: "เป้าหมาย",
  process: "กระบวนการ",
  result: "ผลลัพธ์",
  takeaway: "สิ่งที่ได้จากโปรเจกต์นี้",
  nextStep: "สิ่งที่จะทำต่อ",
};

const SECTION_PLACEHOLDERS = {
  startPoint: "ทำไมถึงเริ่มทำโปรเจกต์นี้? เล่าที่มาแบบสั้น ๆ เช่น ปัญหาที่เจอ, หรือโจทย์ที่ได้รับ",
  goal: "อยากแก้ปัญหาอะไร หรืออยากสร้างอะไรขึ้นมา? สรุปเป้าหมายสั้น ๆ",
  process: "ใช้วิธีไหนหรือเครื่องมืออะไรบ้าง?",
  result: "ได้อะไรออกมาจริง? บอกสิ่งที่เสร็จแล้ว หรือสิ่งที่ผู้ใช้ได้เห็น/ใช้",
  takeaway: "เรียนรู้อะไรจากโปรเจกต์นี้?",
  nextStep: "จะพัฒนาอะไรต่อ อยากต่อยอดอย่างไร หรืออยากได้ความช่วยเหลือด้านใด?",
};

const initialForm = {
  title: "",
  topic: "",
  startPoint: "",
  goal: "",
  process: "",
  result: "",
  takeaway: "",
  nextStep: "",
  categories: [],
  isPublic: true,
  allowComments: false,
  coauthors: [],
};

const initialImages = {
  cover: [],
  startPoint: [],
  goal: [],
  process: [],
  result: [],
  takeaway: [],
  nextStep: [],
};

export default function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState(initialImages);
  const [coauthorName, setCoauthorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fieldCls =
    "mv-field w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-orange-400";
  const areaCls = fieldCls + " resize-none";

  useEffect(() => {
    let canceled = false;

    const hydrateProject = (project) => {
      const detail = project.detail || {};
      const imagesBySection = detail.imagesBySection || {};

      setForm({
        title: project.title || "",
        topic: detail.summary || "",
        startPoint: detail.startPoint || "",
        goal: detail.goal || "",
        process: detail.process || "",
        result: detail.result || "",
        takeaway: detail.takeaway || "",
        nextStep: detail.nextStep || "",
        categories: project.tags || [],
        isPublic: project.public ?? true,
        allowComments: project.comments ?? false,
        coauthors: normalizeCoauthors(project.coauthors),
      });

      setImages({
        cover: project.image ? [project.image] : [],
        startPoint: imagesBySection.startPoint || [],
        goal: imagesBySection.goal || [],
        process: imagesBySection.process || [],
        result: imagesBySection.result || [],
        takeaway: imagesBySection.takeaway || [],
        nextStep: imagesBySection.nextStep || [],
      });
    };

    const fetchProject = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setNotFound(false);
      try {
        // Integration note: `getProject` consolidates API/local fallback; update helper only if backend contract changes.
        const project = await getProject(id);
        if (canceled) return;
        if (!project) {
          setNotFound(true);
          return;
        }
        hydrateProject(project);
      } catch {
        if (!canceled) setNotFound(true);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchProject();

    return () => {
      canceled = true;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleCategory = (tag) =>
    setForm((prev) => {
      const exists = prev.categories.includes(tag);
      const categories = exists
        ? prev.categories.filter((item) => item !== tag)
        : [...prev.categories, tag];
      return { ...prev, categories };
    });

  const addCoauthor = () => {
    const trimmed = coauthorName.trim();
    if (!trimmed) return;
    const slug = slugify(trimmed);
    if (!slug) return;
    setForm((prev) => ({
      ...prev,
      coauthors: prev.coauthors.some((co) => co.slug === slug)
        ? prev.coauthors
        : [...prev.coauthors, { name: trimmed, slug }],
    }));
    setCoauthorName("");
  };

  const removeCoauthor = (slug) => {
    setForm((prev) => ({
      ...prev,
      coauthors: prev.coauthors.filter((c) => c.slug !== slug),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id || isSavingDisabled) return;

    setIsSaving(true);
    const payload = {
      title: form.title.trim() || "Untitled",
      tags: form.categories,
      image: images.cover[0] || "",
      public: !!form.isPublic,
      comments: !!form.allowComments,
      coauthors: form.coauthors,
      detail: {
        summary: form.topic,
        startPoint: form.startPoint,
        goal: form.goal,
        process: form.process,
        result: form.result,
        takeaway: form.takeaway,
        nextStep: form.nextStep,
        imagesBySection: {
          startPoint: images.startPoint,
          goal: images.goal,
          process: images.process,
          result: images.result,
          takeaway: images.takeaway,
          nextStep: images.nextStep,
        },
      },
    };

    try {
      // Integration note: `updateProject` is the single outbound call for edits; extend payload here if backend expects more fields.
      const updated = await updateProject(id, payload);
      if (!updated) {
        alert("ไม่พบโปรเจกต์นี้");
        return;
      }
      navigate(`/project/${updated.id || id}`, { replace: true, state: { project: updated } });
    } catch {
      alert("ไม่สามารถบันทึกโปรเจกต์ได้ ลองอีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  const isSavingDisabled = loading || notFound || isSaving;

  if (loading) {
    return (
      <div className="min-h-screen bg-mOrange text-neutral-900">
        <LandingHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white">กำลังโหลด...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-mOrange text-neutral-900">
        <LandingHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white">ไม่พบโปรเจกต์นี้</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mOrange text-neutral-900">
      <LandingHeader />

      <main className="mx-auto max-w-7xl py-10 px-4 flex flex-col md:flex-row gap-10 justify-center">
        <form
          id="edit-project-form"
          onSubmit={handleSubmit}
          className="flex-1 bg-white rounded-xl p-8 shadow-lg space-y-6"
        >
          <div>
            <label className="mv-label font-bold text-lg mb-1 block">ชื่อโปรเจกต์หรือบทความนี้</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="วันนี้จะเล่าเรื่องราวของโปรเจกต์..."
              className={fieldCls}
            />
            <ImagePicker
              label="+ เพิ่มรูปปก"
              max={1}
              value={images.cover}
              onChange={(v) => setImages((s) => ({ ...s, cover: v }))}
            />
          </div>

          <div>
            <label className="mv-label font-bold text-lg mb-1 block">โควทหรือข้อความสั้น ๆ </label>
            <input
              type="text"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              placeholder="อาจจะเกี่ยวกับแรงบันดาลใจ หรือสิ่งที่ค้นพบ"
              className={fieldCls}
            />
          </div>

          <div>
            <label className="mv-label font-bold text-lg mb-1 block">ผู้ร่วมเขียน (Co-author)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coauthorName}
                onChange={(e) => setCoauthorName(e.target.value)}
                placeholder="เพิ่มชื่อผู้ร่วมเขียน"
                className={fieldCls}
              />
              <button
                type="button"
                onClick={addCoauthor}
                className="mv-btn bg-[#D35400] text-white rounded-full px-4 py-2 font-semibold"
              >
                เพิ่ม
              </button>
            </div>
            {form.coauthors.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.coauthors.map((co) => (
                  <span
                    key={co.slug}
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-200 px-3 py-1 text-sm"
                  >
                    {co.name}
                    <button
                      type="button"
                      onClick={() => removeCoauthor(co.slug)}
                      className="text-xs text-red-600"
                      aria-label={`ลบ ${co.name}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {["startPoint", "goal", "process", "result", "takeaway", "nextStep"].map((key) => (
            <div key={key}>
              <label className="mv-label font-bold text-lg mb-1 block">{SECTION_LABELS[key]}</label>
              <textarea
                name={key}
                value={form[key]}
                onChange={handleChange}
                placeholder={SECTION_PLACEHOLDERS[key]}
                rows={3}
                className={areaCls}
              />
              <ImagePicker value={images[key]} onChange={(v) => setImages((s) => ({ ...s, [key]: v }))} />
            </div>
          ))}

          <div>
            <label className="mv-label font-bold text-lg mb-1 block">หมวดหมู่ที่เกี่ยวข้อง</label>
            <p className="font-IBM text-xs text-neutral-600 mb-2">
              คลิกเลือกเพื่อจัดลำดับความสำคัญของหมวดหมู่ (1 สำคัญที่สุด)
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((tag) => {
                const activeIndex = form.categories.findIndex((item) => item === tag);
                const isActive = activeIndex !== -1;
                const badge = isActive ? activeIndex + 1 : null;
                const colorClass = getTopicChipClass(tag) || "bg-neutral-200 text-neutral-800";
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleCategory(tag)}
                    className={[
                      "flex items-center gap-2 rounded-full border px-4 h-[32px] font-IBM text-sm transition",
                      isActive
                        ? `${colorClass} border-transparent shadow-sm`
                        : "bg-neutral-200 text-neutral-800 border-neutral-300 hover:bg-neutral-300",
                    ].join(" ")}
                    aria-pressed={isActive}
                  >
                    {badge ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white text-xs font-semibold">
                        {badge}
                      </span>
                    ) : null}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingDisabled}
              className={`mv-btn bg-[#D35400] text-white font-bold rounded-full px-8 py-2 hover:brightness-110 active:scale-95 transition ${
                isSavingDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              บันทึก
            </button>
          </div>
        </form>

        <aside className="bg-white rounded-xl p-6 h-fit shadow-md w-full md:w-64">
          <h2 className="mv-heading font-bold mb-3">จัดการโพสต์</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isPublic" checked={form.isPublic} onChange={handleChange} />
              เปิดโพสต์เป็นสาธารณะ
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="allowComments"
                checked={form.allowComments}
                onChange={handleChange}
              />
              เปิดรับความคิดเห็น
            </label>
            <p className="text-xs text-gray-500 pl-6">
              * หากไม่เปิดโพสต์เป็นสาธารณะ โปรเจกต์จะแสดงเฉพาะบนโปรไฟล์ของคุณ
            </p>
          </div>
          <button
            type="submit"
            form="edit-project-form"
            disabled={isSavingDisabled}
            className={`mv-btn mt-6 w-full bg-[#D35400] text-white font-bold rounded-full py-2 hover:brightness-110 active:scale-95 transition ${
              isSavingDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            บันทึก
          </button>
        </aside>
      </main>
    </div>
  );
}
