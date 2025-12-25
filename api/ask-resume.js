import fs from "fs";
import Fuse from "fuse.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: "Question required" });
  }

  try {
    // 🔥 STEP 4: FIX PATH (Correctly resolves relative to this file)
    const dataPath = new URL("../resumeData.json", import.meta.url);
    
    // Read the file using the resolved URL
    const resumeData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    const corpus = [
      { key: "education", value: resumeData.education },
      { key: "skills", value: resumeData.skills?.join(", ") },
      { key: "internships", value: resumeData.internships?.join(", ") },
      { key: "projects", value: resumeData.projects?.join(", ") },
      { key: "certifications", value: resumeData.certifications?.join(", ") },
      { key: "achievements", value: resumeData.achievements?.join(", ") },
    ];

    const fuse = new Fuse(corpus, { 
      keys: ["key"], 
      threshold: 0.4 
    });

    const result = fuse.search(question.toLowerCase());

    if (!result.length) {
      return res.json({ answer: "No matching resume data found." });
    }

    return res.json({ 
      answer: `${result[0].item.key.toUpperCase()}: ${result[0].item.value}` 
    });
    
  } catch (error) {
    console.error("Error reading resume data:", error);
    return res.status(500).json({ error: "Failed to load resume data" });
  }
}