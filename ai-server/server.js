// ai-server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const axios = require("axios");
const Fuse = require("fuse.js"); // ✅ fuzzy search

const app = express();
const PORT = process.env.PORT || 5174;

// ===== Middlewares =====
app.use(express.json());

// ✅ STEP 3: FIX CORS (LOCAL + DEPLOYED)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://vvdmahesh3.github.io",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: "Too many requests, slow down." },
});
app.use("/api/", limiter);

// ===== Load Resume Data =====
let resumeData = {};
try {
  const dataPath = path.join(__dirname, "resumeData.json");
  if (fs.existsSync(dataPath)) {
    resumeData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    console.log("✅ Loaded resumeData.json");
  } else {
    console.warn("⚠️ resumeData.json not found, using empty fallback.");
    resumeData = {
      education: "",
      internships: [],
      skills: [],
      certifications: [],
      projects: [],
      achievements: [],
      personal: { interests: [], languages: [] },
    };
  }
} catch (err) {
  console.error("❌ Failed to load resume data:", err);
}

// ===== Nodemailer Setup =====
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

let mailer = null;
if (EMAIL_USER && EMAIL_PASS) {
  mailer = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  mailer
    .verify()
    .then(() => console.log("✅ Nodemailer ready"))
    .catch((err) => console.warn("❌ Nodemailer failed:", err.message || err));
} else {
  console.warn("⚠️ EMAIL_USER or EMAIL_PASS missing — email disabled.");
}

// ===== Helper: Send Feedback Email =====
async function sendFeedbackEmail({ name, email, category, feedback, timestamp }) {
  if (!mailer) throw new Error("Mailer not configured");

  const to = process.env.EMAIL_RECEIVER || EMAIL_USER;
  const subject = `Portfolio Feedback — ${category || "general"} — ${
    name || "Anonymous"
  }`;

  return mailer.sendMail({
    from: `"Portfolio Feedback" <${EMAIL_USER}>`,
    to,
    subject,
    text: `${timestamp}\n${name}\n${email}\n${category}\n\n${feedback}`,
  });
}

// ===== AI Resume Assistant (Fuzzy + Smart) =====
function generateLocalAnswer(question = "") {
  const q = (question || "").toLowerCase().trim();
  if (!q) return "Please ask a question 🙂 (e.g. internships, skills, education)";

  // 🔍 Build searchable dataset
  const corpus = [
    { key: "education", value: resumeData.education },
    { key: "internships", value: (resumeData.internships || []).join(" • ") },
    { key: "skills", value: (resumeData.skills || []).join(", ") },
    { key: "certifications", value: (resumeData.certifications || []).join(" • ") },
    { key: "projects", value: (resumeData.projects || []).join(" • ") },
    { key: "achievements", value: (resumeData.achievements || []).join(" • ") },
    { key: "interests", value: (resumeData.personal?.interests || []).join(", ") },
    { key: "languages", value: (resumeData.personal?.languages || []).join(", ") },
  ];

  // ✅ Fuzzy search setup
  const fuse = new Fuse(corpus, {
    keys: ["key"],
    threshold: 0.4, // typo tolerance
  });

  const results = fuse.search(q);
  if (results.length > 0) {
    const best = results[0].item;
    return `${best.key.toUpperCase()}: ${best.value}`;
  }

  return "🤔 I couldn’t catch that. Try asking about internships, skills, projects, certifications, or education.";
}

// ===== API Routes =====

// Ask resume Q&A
app.post("/api/ask-resume", (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question) return res.status(400).json({ error: "Missing question" });

    const answer = generateLocalAnswer(question);
    return res.json({ answer });
  } catch (err) {
    console.error("ask-resume error:", err);
    return res.status(500).json({ error: "Assistant error" });
  }
});

// Feedback
app.post("/api/feedback", async (req, res) => {
  try {
    const { name, email, category, feedback } = req.body || {};
    if (!feedback) return res.status(400).json({ error: "Missing feedback" });

    const timestamp = new Date().toISOString();

    // 1. Email
    if (mailer) {
      try {
        await sendFeedbackEmail({ name, email, category, feedback, timestamp });
        console.log("✅ Feedback email sent");
      } catch (err) {
        console.error("❌ Email send failed:", err.message || err);
      }
    }

    // 2. Google Sheets webhook (optional)
    if (process.env.SHEETS_WEBHOOK_URL) {
      try {
        await axios.post(process.env.SHEETS_WEBHOOK_URL, {
          name,
          email,
          category,
          feedback,
          timestamp,
          secret: process.env.SHEETS_WEBHOOK_SECRET,
        });
        console.log("✅ Feedback logged to Sheets");
      } catch (err) {
        console.error("❌ Sheet append failed:", err.message || err);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("feedback error:", err);
    return res.status(500).json({ error: "Could not process feedback" });
  }
});

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Static certs
app.use("/certs", express.static(path.join(__dirname, "certs")));

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`✅ Resume Assistant running at http://localhost:${PORT}`);
});