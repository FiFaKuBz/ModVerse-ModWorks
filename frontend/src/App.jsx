import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// หน้าเดิม
import ProfilePage from "./pages/ProfilePage";
import OtherProfilePage from "./pages/OtherProfilePage";
import EditProfilePage from "./pages/EditProfilePage";

// ✅ เพิ่มหน้านี้เข้ามาใหม่
import LandingLogin from "./pages/LandingLogin";

function App() {
  return (
    <Router>
      <Routes>
        {/* 🟢 หน้าใหม่: หน้า Landing Login */}
        <Route path="/landing-login" element={<LandingLogin />} />

        {/* 🔵 หน้า Home เดิม */}
        <Route path="/" element={<h1 className="text-center mt-10">Home</h1>} />

        {/* 🔵 หน้าของ Profile ที่มีอยู่แล้ว */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:username" element={<OtherProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;
