import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../api/profile";

const FALLBACK_PROFILE = {
  avatar: "",
  username: "Username",
  email: "Email@gmail.com",
  about: "description",
  showSavedPublicly: true,
};

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let canceled = false;
    const hydrate = async () => {
      try {
        const data = await getProfile();
        if (!canceled) {
          setProfile(data || FALLBACK_PROFILE);
        }
      } catch {
        if (!canceled) setProfile(FALLBACK_PROFILE);
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    hydrate();
    return () => {
      canceled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const toggleVisibility = () => {
    setProfile((prev) => ({ ...prev, showSavedPublicly: !prev.showSavedPublicly }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatar: reader.result || "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!profile || saving) return;
    setSaving(true);
    try {
      const updated = await updateProfile(profile);
      setProfile(updated);
      navigate(-1);
    } catch {
      alert("ไม่สามารถบันทึกโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        กำลังโหลดโปรไฟล์...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white text-gray-900 font-['Anuphan'] flex flex-col items-center">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-black hover:opacity-70 transition"
      >
        <X className="w-8 h-8" />
      </button>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`absolute top-6 right-6 bg-[#D35400] text-white font-semibold px-6 py-2 rounded-xl transition ${
          saving ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
        }`}
      >
        {saving ? "Saving..." : "Done"}
      </button>

      <div className="w-full max-w-[800px] px-[clamp(1rem,4vw,3rem)] mt-16">
        <div className="flex flex-col items-center mb-10">
          <div className="w-[100px] h-[100px] rounded-full bg-mGrey overflow-hidden flex items-center justify-center">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="avatar"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-gray-600 text-sm">NO IMG</span>
            )}
          </div>

          <input
            id="avatarInput"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />

          <label
            htmlFor="avatarInput"
            className="cursor-pointer mt-4 px-6 py-2 bg-[#D35400] text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            Edit
          </label>
        </div>

        <form className="flex flex-col gap-8">
          <div>
            <label className="block text-lg font-semibold mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={profile.username}
              onChange={handleChange}
              placeholder="Username"
              className="w-full border border-[#D35400] rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-[#D35400] placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              placeholder="Email@gmail.com"
              className="w-full border border-[#D35400] rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-[#D35400] placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-1">About</label>
            <textarea
              name="about"
              value={profile.about}
              onChange={handleChange}
              placeholder="Tell something about yourself..."
              rows={3}
              className="w-full border border-[#D35400] rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-[#D35400] placeholder-gray-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <h3 className="font-semibold text-lg">Show All Projects</h3>
              <p className="text-gray-700 text-sm mt-1 leading-snug">
                People visiting your profile will be able to see all the projects you saved. <br />
                Projects saved to a secret board won’t be visible.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleVisibility}
              className={`relative w-10 h-5 flex items-center rounded-full border border-[#D35400] transition ${
                profile.showSavedPublicly ? "bg-[#D35400]" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${
                  profile.showSavedPublicly ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
