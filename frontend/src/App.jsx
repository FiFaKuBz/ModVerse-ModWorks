import { Routes, Route } from "react-router-dom";

import ProfilePage from "./pages/ProfilePage";
import OtherProfilePage from "./pages/OtherProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import LandingLogin from "./pages/LandingLogin";
import ShowcasePage from "./pages/ShowCasePage";

import { IdleWarningModal } from "./session/IdleWarningModal";
import ProtectedRoute from "./session/ProtectedRoute";

function App() {
  return (
    <>
      <Routes>
        {/* Landing Login */}
        <Route path="/" element={<LandingLogin />} />

        {/* Showcase Page */}
        <Route path="/showcase" element={<ShowcasePage />} />

        {/* Profile Pages */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:username" element={<OtherProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
      </Routes>

      {/* Session Modal can be global */}
      <IdleWarningModal />
    </>
  );
}

export default App;
