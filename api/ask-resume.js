import fs from "fs";
import path from "path";
import Fuse from "fuse.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: "Question required" });
  }

  const dataPath = path.join(process.cwd(), "ai-server", "resumeData.json");
  const resumeData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const corpus = [
    { key: "education", value: resumeData.education },
    { key: "internships", value: resumeData.internships.join(" • ") },
    { key: "skills", value: resumeData.skills.join(", ") },
    { key: "projects", value: resumeData.projects.join(" • ") },
    { key: "certifications", value: resumeData.certifications.join(" • ") },
    { key: "achievements", value: resumeData.achievements.join(" • ") },
  ];

  const fuse = new Fuse(corpus, {
    keys: ["key", "value"],
    threshold: 0.35,
  });

  const result = fuse.search(question.toLowerCase());
  if (!result.length) {
    return res.json({ answer: "Try asking about skills, internships, or projects." });
  }

  const best = result[0].item;
  res.json({ answer: `${best.key.toUpperCase()}: ${best.value}` });
}
