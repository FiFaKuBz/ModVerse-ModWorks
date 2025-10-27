import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ProfilePage from "./pages/ProfilePage";
import OtherProfilePage from "./pages/OtherProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import LandingLogin from "./pages/LandingLogin";
import ShowcasePage from "./pages/ShowcasePage";

function App() {
  return (
    <Router>
      <Routes>
        {/*Landing Login */}
        <Route path="/" element={<LandingLogin />} />

        {/*Showcase Page */}
        <Route path="/showcase" element={<ShowcasePage />} />

        {/*Profile*/}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:username" element={<OtherProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;
