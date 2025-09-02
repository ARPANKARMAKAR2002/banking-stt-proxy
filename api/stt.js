import axios from "axios";
import formidable from "formidable";
import FormData from "form-data";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // disable body parser for file uploads
  },
};

const BASE_URL = "http://140.245.5.226:9000/api/v1/voice/stt";

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // ✅ Handle preflight
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    // Parse multipart form-data (audio upload)
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const file = files.media?.[0]; // expect frontend to send "media"
    if (!file) {
      return res.status(400).json({ error: "No media file uploaded" });
    }

    // Build new form-data to forward to OCI STT
    const fd = new FormData();
    fd.append("media", fs.createReadStream(file.filepath), file.originalFilename);

    // Forward request to OCI STT service
    const response = await axios.post(BASE_URL, fd, {
      headers: fd.getHeaders(),
      timeout: 60000,
    });

    return res.status(response.status).json(response.data);
  } catch (err) {
    console.error("STT Proxy Error:", err.message);
    return res.status(err.response?.status || 500).json({
      error: err.response?.data || err.message || "Proxy error",
    });
  }
}
