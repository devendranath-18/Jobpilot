import express from "express";
import { fileURLToPath } from "url";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { runAgent } from "./agentClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Store uploaded resumes in server/uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // e.g. ".pdf" or ".docx"
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/analyze", upload.single("resume"), async (req, res) => {
  const jdText = req.body.jd_text;
  const resumeFile = req.file;

  if (!jdText || !resumeFile) {
    return res.status(400).json({ error: "jd_text and resume file are both required." });
  }

  // Set up Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  function sendEvent(type: string, data: any) {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  }

  try {
    const goalPrompt = `
Here is a job description:

"""
${jdText}
"""

My resume file is located at: ${resumeFile.path}

Please parse the job description, parse my resume, match them, tailor my most recent role's bullet points, write a cover letter, and save the completed application.
`;

    const result = await runAgent(goalPrompt, (event) => {
      sendEvent("progress", event);
    });

    sendEvent("complete", { result });
  } catch (err: any) {
    console.error("Error in /api/analyze:", err);
    sendEvent("error", { error: err.message || "Internal server error" });
  } finally {
    res.end();
  }
});

app.listen(port, () => {
  console.log(`JobPilot API server running on http://localhost:${port}`);
});