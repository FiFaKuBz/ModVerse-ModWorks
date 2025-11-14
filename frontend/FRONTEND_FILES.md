# Frontend File Reference

This document describes every file inside the `frontend/` directory so the team knows where to make changes during the upcoming integration work.

## Project-Level Files

- `package.json` – Dependencies, scripts (`dev`, `build`, `lint`), and toolchain settings for the Vite + React app.
- `README.md` – Quick-start instructions and high-level overview for the frontend workspace.
- `vite.config.js` – Vite bundler configuration, including path aliases and dev-server tweaks.
- `eslint.config.js` – ESLint rules and parser settings enforced via `npm run lint`.
- `index.html` – Root HTML template used by Vite to boot the SPA and mount React.
- `mock-server.js` – Lightweight mock API server used during local development before the backend is wired.

## Assets

SVGs inside `frontend/asset/` and `frontend/src/assets/` are used by buttons, icons, and branding across the app. Examples: `MVMWlogo.svg` (logo), `create-button.svg`, `ThumbsUp-icon.svg`, etc. They are static files imported by components such as `LandingHeader` or `ProjectCard`.

## Source Entry Points

- `src/main.jsx` – React root renderer: wraps `<App />` with providers (session, router) and attaches it to `#root`.
- `src/App.jsx` – Application shell and router definition: registers pages (landing, showcase, profiles, project detail, create/edit flows) and protects private routes.
- `src/index.css` – Global Tailwind/utility styles plus custom tokens for the ModVerse theme.

## Session Layer

- `src/session/SessionContext.js` – Plain React context + hook for accessing session info across the app.
- `src/session/SessionProvider.jsx` – Owns authentication state, session timers, idle warnings, and exposes login/logout helpers via the context.
- `src/session/ProtectedRoute.jsx` – Guards private routes; redirects unauthenticated users to login.
- `src/session/IdleWarningModal.jsx` – UI modal that warns users before their session expires and lets them extend it.

## API Helpers

- `src/api/projects.js` – Client-side abstraction for project CRUD. Calls `/api/projects` when the backend is live and falls back to `localStorage` in offline mode.

## Auth

- `src/auth/TwoFactorMock.jsx` – Mock 2FA challenge component used in the login/onboarding flow.

## Common Components

- `src/components/common/BackButton.jsx` – Reusable back navigation button used on detail/profile pages.
- `src/components/common/CreateButton.jsx` – Floating “สร้าง/โพสต์” button that links to the create page.
- `src/components/common/CustomButton.jsx` – Styled button primitive shared across multiple screens.
- `src/components/common/Pagination.jsx` – Pagination control (prev/next buttons + page numbers) for showcase and profile grids.
- `src/components/common/ProfileOptionsModal.jsx` – Options popover used on profile pages (share, edit, etc.).
- `src/components/common/ShareModal.jsx` – Modal that renders share links for projects or profiles.

## Landing Components

- `src/components/Landing/LandingHeader.jsx` – Global header rendered on landing and showcase pages; contains navigation, CTA, and topic filter controls.

## Topics

- `src/components/topics/TopicTray.jsx` – Pill tray UI for selecting topics/tags; defines color mapping used across other components.

## Profile Components

- `src/components/Profile/ProfileHeader.jsx` – Hero section for profiles (avatar, bio, contact info).
- `src/components/Profile/ProfileStats.jsx` – Stats row showing followers, likes, action buttons (share, edit, follow).
- `src/components/Profile/ProfileTabs.jsx` – Tab switcher between “Created”, “Saved”, etc.
- `src/components/Profile/ProjectCard.jsx` – Card layout used throughout the app to present a project (image, title, contributor, tags).
- `src/components/Profile/RecruiterRequestsTable.jsx` – Table UI for recruiter requests (used on recruiter-specific profile views).

## Pages

- `src/pages/LandingLogin.jsx` – Public login page with social login buttons and the mock 2FA flow.
- `src/pages/LandingAboutPage.jsx` – Static marketing/about page describing ModVerse.
- `src/pages/ShowCasePage.jsx` – Main gallery: fetches projects, supports topic filtering, pagination, and shows the creation CTA.
- `src/pages/CreatePage.jsx` – Wizard for posting a new project: handles file uploads, structured sections, co-authors, and category selection; submits through `createProject`.
- `src/pages/EditProjectPage.jsx` – Same UI as create but pre-filled; updates an existing project using `getProject`/`updateProject`.
- `src/pages/EditProfilePage.jsx` – Form for editing the user’s profile (avatar, bio, social links).
- `src/pages/ProfilePage.jsx` – Authenticated user’s profile with tabs for created/saved projects; fetches from `listProjects` and merges co-authored work.
- `src/pages/OtherProfilePage.jsx` – Public view of another user’s profile; uses the same components but disables owner-only actions.
- `src/pages/ProjectDetailPage.jsx` – Project detail view showing hero, sections, tags, co-authors, and recommended projects pulled from `listProjects`.
- `src/pages/SettingsPage.jsx` – Account settings screen (currently mocks 2FA toggling and shows integration TODOs).

## Assets Referenced by Pages

The SVGs in `frontend/asset/` (e.g., `edit-icon.svg`, `saved-icon.svg`, `Emphasize-icon.svg`) are consumed by the pages/components above to render consistent iconography.

---

All files are now wired through the shared `projects` API helper or provide mock fallbacks noted in their comments, so swapping to the live backend only requires updating that helper. Feel free to extend this document as new pages or components are added.
