# Frontend File Map

Quick guide to the `frontend/` folder. Use this when you need to find or edit something fast.

## Project Setup

- `package.json` – npm scripts (`dev`, `build`, `lint`) and dependencies.
- `README.md` – How to install and run the app.
- `vite.config.js` – Vite build + dev server settings.
- `eslint.config.js` – ESLint rules.
- `index.html` – Base HTML file for the app.
- `mock-server.js` – Local mock API for dev/testing.

## Assets

SVG icons live under `frontend/asset/`. Import them in components when you need buttons, logos, etc.

## Entry Points

- `src/main.jsx` – Renders `<App />` with router + session provider.
- `src/App.jsx` – Route list and shared layout.
- `src/index.css` – Tailwind setup and custom classes.

## Session Layer

- `session/SessionContext.js` – `useSession` hook.
- `session/SessionProvider.jsx` – Stores user info, login/logout, idle timers.
- `session/ProtectedRoute.jsx` – Blocks pages unless logged in.
- `session/IdleWarningModal.jsx` – Session timeout warning dialog.

## API Helpers

- `api/projects.js` – All project CRUD calls (`list`, `get`, `create`, `update`). Tries `/api/projects`, falls back to `localStorage`.
- `api/profile.js` – Profile fetch/update (`getProfile`, `updateProfile`, `getProfileBySlug`). Uses `/api/users/profile` + local cache.

## Auth

- `auth/TwoFactorMock.jsx` – Temporary 2FA step until real backend flow is ready.

## Common Components

- `common/BackButton.jsx` – Back navigation.
- `common/CreateButton.jsx` – Floating “create project” FAB.
- `common/CustomButton.jsx` – Styled button base.
- `common/Pagination.jsx` – Prev/next/page number control.
- `common/ProfileOptionsModal.jsx` – Extra actions on profile.
- `common/ShareModal.jsx` – Share links modal.

## Landing + Topics

- `components/Landing/LandingHeader.jsx` – Header for landing, login, showcase pages.
- `components/topics/TopicTray.jsx` – Tag chips with preset colors.

## Profile Components

- `ProfileHeader.jsx` – Avatar + bio banner.
- `ProfileStats.jsx` – Followers, likes, share/edit/follow buttons.
- `ProfileTabs.jsx` – Switch between Created/Saved tabs.
- `ProjectCard.jsx` – Shared card for every project listing.
- `RecruiterRequestsTable.jsx` – Table view for recruiter data.

## Pages

- `LandingLogin.jsx` – Login/signup screen. Google button hits `/api/auth/login`.
- `LandingAboutPage.jsx` – Static about page. Replace with CMS data later if needed.
- `ShowCasePage.jsx` – Main gallery. Uses `listProjects` for data + topic filtering.
- `CreatePage.jsx` – New project form. Sends data through `createProject`.
- `EditProjectPage.jsx` – Edit existing project. Uses `getProject` + `updateProject`.
- `EditProfilePage.jsx` – Profile editor (avatar, about, visibility).
- `ProfilePage.jsx` – User’s own profile with Created/Saved tabs.
- `OtherProfilePage.jsx` – Public view of another user by slug.
- `ProjectDetailPage.jsx` – Full project detail with recommendations.
- `SettingsPage.jsx` – Account settings (currently handles 2FA toggle via profile API).

## Icons

`frontend/asset/*.svg` contains the logo, icons for cards, buttons, etc. Import where needed.

## Integration Tips

- Always use `api/projects.js` or `api/profile.js` instead of writing new fetch calls. They already talk to the backend and handle offline fallback.
- Shared helpers you’ll see often:
  - `slugify` – Turns names into slugs for URLs.
  - `normalizeCoauthors` – Makes sure co-author data is `{ name, slug }`.
  - `score7d` – Ranks projects for recommendations (likes + saves ×2 + comments ×3).
- External libraries:
  - React + React Router (hooks, `<BrowserRouter>`, `<Routes>`, etc.).
  - Vite (`npm run dev`).
  - lucide-react (icons like the `X` icon).
  - Tailwind CSS (utility classes defined in `index.css`).
  - Session context (`SessionProvider`, `useSession`).
