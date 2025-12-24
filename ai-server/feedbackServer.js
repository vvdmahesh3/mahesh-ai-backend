// ai-server/feedbackServer.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.FEEDBACK_PORT || 5180;

// Middleware
app.use(cors({ origin: "http://localhost:5173" })); // Allow your frontend
app.use(express.json());

// ✅ API route for feedback
app.post("/api/feedback", async (req, res) => {
  try {
    const { name, email, category, feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({ error: "Feedback is required" });
    }

    // ✅ STEP 2: FIX VARIABLE USAGE
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Updated from FEEDBACK_EMAIL
        pass: process.env.EMAIL_PASS, // Updated from FEEDBACK_PASS (Gmail App Password)
      },
    });

    // Email message
    const mailOptions = {
      from: `"Portfolio Feedback" <${process.env.EMAIL_USER}>`, // Updated sender
      to: process.env.EMAIL_RECEIVER, // Updated from RECEIVE_EMAIL
      subject: `📩 New ${category} from ${name || "Anonymous"}`,
      text: `
From: ${name || "Anonymous"} (${email || "No email provided"})
Category: ${category}
Feedback: ${feedback}
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "✅ Feedback sent successfully!" });
  } catch (err) {
    console.error("❌ Feedback error:", err.message);
    return res.status(500).json({ error: "Failed to send feedback" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Feedback server running at http://localhost:${PORT}`);
});