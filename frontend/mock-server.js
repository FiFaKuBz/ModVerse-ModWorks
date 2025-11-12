// mock-server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// --- Simple mock endpoints for testing your frontend --- //

// Pretend OAuth login
app.post("/api/login/start", (req, res) => {
  res.json({ need2fa: true, userId: "u_123" });
});

// Pretend 2FA verification
app.post("/api/2fa/verify", (req, res) => {
  const { code } = req.body;
  if (code === "123456") {
    return res.json({ ok: true, token: "mock.jwt.token" });
  }
  res.status(400).json({ ok: false, error: "Invalid code" });
});

// Pretend token validation
app.get("/api/session/validate", (req, res) => {
  res.json({ ok: true, expInSec: 1800 }); // valid for 30 min
});

// Start server
app.listen(5174, () => {
  console.log("✅ Mock API running at http://localhost:5174");
});
