// src/App.jsx
import { Routes, Route } from "react-router-dom";

import ProfilePage from "./pages/ProfilePage";
import OtherProfilePage from "./pages/OtherProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import LandingLogin from "./pages/LandingLogin";
import ShowcasePage from "./pages/ShowCasePage";
import SettingsPage from "./pages/SettingsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import CreatePage from "./pages/CreatePage";
import EditProjectPage from "./pages/EditProjectPage";
import { IdleWarningModal } from "./session/IdleWarningModal";
import ProtectedRoute from "./session/ProtectedRoute";

import LandingAboutPage from "./pages/LandingAboutPage"; 

function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LandingLogin />} />
        <Route path="/landing-about" element={<LandingAboutPage />} />
        
        {/* Everything under this gate requires a live session */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<ShowcasePage />} />
          <Route path="/project/:id" element={<ProjectDetailPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/edit-project/:id" element={<EditProjectPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<OtherProfilePage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

        </Route>
      </Routes>

      {/* lives under SessionProvider (see main.jsx) */}
      <IdleWarningModal />
    </>
  );
}

export default App;
