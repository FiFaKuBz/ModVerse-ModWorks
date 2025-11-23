// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import SessionProvider from "./session/SessionProvider";
import { NotificationProvider } from "./session/NotificationContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Router lives here exactly once */}
    <BrowserRouter>
      {/* Anything that uses useNavigate/useLocation must be inside Router */}
      <SessionProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </SessionProvider>
    </BrowserRouter>
  </React.StrictMode>
);
