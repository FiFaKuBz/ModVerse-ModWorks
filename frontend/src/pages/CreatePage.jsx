import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LandingHeader from "../components/Landing/LandingHeader";

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

const CATEGORY_COLORS = {
  "UX/UI": "bg-mPurple text-black",
  Transportation: "bg-mBlue text-black",
  Database: "bg-mYellow text-black",
  Algorithm: "bg-mGreen text-black",
  "Digital Circuit": "bg-mPink text-black",
  "Data Visualization": "bg-amber-200 text-black",
};

const STORAGE_KEY = "mv_user_projects";

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadUserProjects = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveUserProjects = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
};

/* ---------- small reusable picker (embedded) ---------- */
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
      {/* button */}
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

      {/* previews */}
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
                title="ลบรูปภาพ"
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
/* ----------------------------------------------------- */

export default function CreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
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
  });

  const [images, setImages] = useState({
    cover: [],
    startPoint: [],
    goal: [],
    process: [],
    result: [],
    takeaway: [],
    nextStep: [],
  });

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

  const [coauthorName, setCoauthorName] = useState("");

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

  const handleSubmit = (e) => {
    e.preventDefault();

    const projectId = `u-${Date.now()}`;
    const project = {
      id: projectId,
      title: form.title.trim() || "Untitled",
      contributor: "You",
      tags: form.categories,
      image: images.cover[0] || "",
      createdAt: Date.now(),
      metrics7d: { likes: 0, saves: 0, comments: 0 },
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

    const existing = loadUserProjects();
    existing.unshift(project);
    saveUserProjects(existing);

    navigate(`/project/${projectId}`, { state: { project } });
  };

  const fieldCls =
    "mv-field w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-orange-400";
  const areaCls = fieldCls + " resize-none";

  return (
    <div className="min-h-screen bg-mOrange text-neutral-900">
      <LandingHeader />

      <main className="mx-auto max-w-7xl py-10 px-4 flex flex-col md:flex-row gap-10 justify-center">
        {/* ---------- Left: form ---------- */}
        <form onSubmit={handleSubmit} className="flex-1 bg-white rounded-xl p-8 shadow-lg space-y-6">
          {/* Project title */}
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

          {/* Topic */}
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

          {/* Co-authors */}
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

          {/* Starting point */}
          <div>
            <label className="mv-label font-bold text-lg mb-1 block">จุดเริ่มต้น</label>
            <textarea
              name="startPoint"
              value={form.startPoint}
              onChange={handleChange}
              placeholder="ทำไมถึงเริ่มทำโปรเจกต์นี้? เล่าที่มาแบบสั้น ๆ เช่น ปัญหาที่เจอ, หรือโจทย์ที่ได้รับ"
              rows={3}
              className={areaCls}
            />
            <ImagePicker
              value={images.startPoint}
              onChange={(v) => setImages((s) => ({ ...s, startPoint: v }))}
            />
          </div>

          {/* Goal */}
          <div>
            <label className="mv-label font-bold text-lg mb-1 block">เป้าหมาย</label>
            <textarea
              name="goal"
              value={form.goal}
              onChange={handleChange}
              placeholder="อยากแก้ปัญหาอะไร หรืออยากสร้างอะไรขึ้นมา? สรุปเป้าหมายสั้น ๆ"
              rows={3}
              className={areaCls}
            />
            <ImagePicker value={images.goal} onChange={(v) => setImages((s) => ({ ...s, goal: v }))} />
          </div>

          {/* Process */}
          <div>
            <label className="mv-label font-bold text-lg mb-1 block">กระบวนการ</label>
            <textarea
              name="process"
              value={form.process}
              onChange={handleChange}
              placeholder="ใช้วิธีไหนหรือเครื่องมืออะไรบ้าง?"
              rows={3}
              className={areaCls}
            />
            <ImagePicker value={images.process} onChange={(v) => setImages((s) => ({ ...s, process: v }))} />
          </div>

          {/* Result */}
          <div>
            <label className="mv-label font-bold text-lg mb-1 block">ผลลัพธ์</label>
            <textarea
              name="result"
              value={form.result}
              onChange={handleChange}
              placeholder="ได้อะไรออกมาจริง? บอกสิ่งที่เสร็จแล้ว หรือสิ่งที่ผู้ใช้ได้เห็น/ใช้"
              rows={3}
              className={areaCls}
            />
            <ImagePicker value={images.result} onChange={(v) => setImages((s) => ({ ...s, result: v }))} />
          </div>

          {/* Takeaway */}
          <div>
            <label className="mv-label font-bold text-lg mb-1 block">สิ่งที่ได้จากโปรเจกต์นี้</label>
            <textarea
              name="takeaway"
              value={form.takeaway}
              onChange={handleChange}
              placeholder="เรียนรู้อะไรจากโปรเจกต์นี้?"
              rows={3}
              className={areaCls}
            />
            <ImagePicker value={images.takeaway} onChange={(v) => setImages((s) => ({ ...s, takeaway: v }))} />
          </div>

          {/* Next step */}
          <div>
            <label className="mv-label font-bold text-lg mb-1 block">สิ่งที่อยากทำต่อ</label>
            <textarea
              name="nextStep"
              value={form.nextStep}
              onChange={handleChange}
              placeholder="จะพัฒนาอะไรต่อ อยากต่อยอดอย่างไร หรืออยากได้ความช่วยเหลือด้านใด?"
              rows={3}
              className={areaCls}
            />
            <ImagePicker value={images.nextStep} onChange={(v) => setImages((s) => ({ ...s, nextStep: v }))} />
          </div>

          {/* Tags */}
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
                const colorClass = CATEGORY_COLORS[tag] || "bg-neutral-200 text-neutral-800";
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

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="mv-btn bg-[#D35400] text-white font-bold rounded-full px-8 py-2 hover:brightness-110 active:scale-95 transition"
            >
              โพสต์
            </button>
          </div>
        </form>

        {/* ---------- Right: options ---------- */}
        <aside className="bg-white rounded-xl p-6 h-fit shadow-md w-full md:w-64">
          <h2 className="mv-heading font-bold mb-3">จัดการโพสต์</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isPublic"
                checked={form.isPublic}
                onChange={handleChange}
              />
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
            {/* TODO(team): wire allowComments to comment module on ProjectDetailPage */}
            <p className="text-xs text-gray-500 pl-1">
              * หากไม่เปิดโพสต์เป็นสาธารณะ โปรเจกต์จะแสดงเฉพาะในโปรไฟล์ของคุณ
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert("บันทึกแล้ว (mock)")}
            className="mv-btn mt-6 w-full bg-[#D35400] text-white font-bold rounded-full py-2 hover:brightness-110 active:scale-95 transition"
          >
            บันทึก
          </button>
        </aside>
      </main>
    </div>
  );
}
