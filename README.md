# YouTube → PDF Summary

A lightweight Chrome extension that turns YouTube videos into clean, downloadable PDF summaries using AI.

The extension detects the YouTube video you are currently watching, fetches its transcript, generates a structured summary using OpenAI, and formats the result into a polished PDF you can save, study, or share.

Built as a practical tool to retain information from long videos without rewatching them.

---

## Features

- Automatically detects the active YouTube video
- Fetches the full video transcript
- Generates an accurate, structured AI summary
- Converts the summary into a clean, readable PDF
- No raw markdown or formatting clutter in the final output
- Fully open source and easy to extend

---

## Use Cases

- Studying lectures or educational content
- Summarising long technical tutorials
- Saving key points from research videos
- Reviewing information without rewatching full videos
- Building personal knowledge archives

---

## Tech Stack

- Chrome Extension (Manifest v3)
- Node.js backend (Express)
- OpenAI API
- jsPDF for PDF generation
- YouTube transcript extraction

---

## Project Structure

├── backend/
│ └── yt-summary-backend/
│ ├── server.js
│ ├── package.json
│ └── .env
│
└── yt-summary-extension/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
└── libs/
└── jspdf.umd.min.js


---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/RyansRepos/<repo-name>.git
cd <repo-name>
```

## 2. Backend setup

Navigate to the backend folder:
```bash
cd backend/yt-summary-backend
```

Install dependencies:
```bash
npm install
```

Create a .env file in this folder:
```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=4000
```

Start the backend server:
```bash
node server.js
```

You should see:
```bash
YouTube summariser backend running on http://localhost:4000
```

## 3. Chrome extension setup

Open Chrome and go to:
```bash
chrome://extensions
```
Enable Developer mode (top right)
Click Load unpacked
Select the yt-summary-extension folder
The extension should now appear in your Chrome toolbar.

## How to Use

1. Open any YouTube video
2. Click the extension icon
3. Click Summarise Video
4. Wait a few seconds while the transcript is processed
5. Click Download PDF to save the summary
6. The generated PDF is cleanly formatted with headings and bullet points, ready for reading or annotation.

## Why This Exists

I built this tool because I regularly watch long YouTube videos for learning, but rarely retain everything. Rewatching content just to find one detail is inefficient, so this project turns videos into something reusable and searchable: a clean PDF summary.
