// server.js – using youtube-transcript-plus (CommonJS)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");


const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/summarise", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
      return res.status(400).json({ error: "Invalid or missing YouTube URL" });
    }

    console.log("Fetching transcript for:", url);

    // ✅ Dynamic import for ESM module (works in CommonJS)
    const { fetchTranscript } = await import("youtube-transcript-plus");

    let transcriptSegments;
    try {
      // youtube-transcript-plus can take either videoId OR full URL
      transcriptSegments = await fetchTranscript(url, {
        lang: "en"
      });
    } catch (err) {
      console.error("Transcript error:", err?.message || err);
      return res.status(200).json({
        summary:
          "Summary unavailable. This video appears to have no accessible transcript or captions."
      });
    }

    if (!Array.isArray(transcriptSegments) || transcriptSegments.length === 0) {
      return res.status(200).json({
        summary:
          "Summary unavailable. This video appears to have no accessible transcript or captions."
      });
    }

    const fullTranscript = transcriptSegments.map((s) => s.text).join(" ");

    const maxChars = 12000;
    const trimmedTranscript =
      fullTranscript.length > maxChars
        ? fullTranscript.slice(0, maxChars)
        : fullTranscript;

    console.log(
      "Transcript length (chars):",
      trimmedTranscript.length,
      "(original:",
      fullTranscript.length,
      ")"
    );

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You summarise YouTube video transcripts for busy people.\n" +
            "- Use clear headings and bullet points.\n" +
            "- Typical sections: Overview, Key Points, Interesting Details, Takeaways.\n" +
            "- Be accurate to the transcript, not generic.\n" +
            "- Write as if you actually watched the video."
        },
        {
          role: "user",
          content:
            "Here is the transcript of a YouTube video. Summarise it in a structured markdown-style format, no more than about two A4 pages of text:\n\n" +
            trimmedTranscript
        }
      ]
    });

    let summaryText = "No summary text found.";

    try {
      const output = response.output;

      if (Array.isArray(output) && output.length > 0) {
        const messageItem =
          output.find((item) => item.type === "message") || output[0];

        if (messageItem && Array.isArray(messageItem.content)) {
          const textItem =
            messageItem.content.find(
              (c) => c.type === "output_text" && typeof c.text === "string"
            ) || messageItem.content[0];

          if (textItem && typeof textItem.text === "string") {
            summaryText = textItem.text;
          }
        }
      }
    } catch (extractErr) {
      console.error("Error extracting text from response:", extractErr);
    }

    return res.json({ summary: summaryText });
  } catch (err) {
    console.error("Error from OpenAI:", err);
    return res.status(500).json({ error: "Failed to summarise video" });
  }
});


const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`YouTube summariser backend running on http://localhost:${port}`);
});
