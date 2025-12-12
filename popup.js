const statusEl = document.getElementById("status");
const summariseBtn = document.getElementById("summariseBtn");
const downloadBtn = document.getElementById("downloadBtn");

let lastSummary = "";
let lastTitle = "YouTube Summary";

function setStatus(text) {
  statusEl.textContent = text;
}

// Check current tab when popup opens
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
    summariseBtn.disabled = false;
    setStatus("Ready. Click “Summarise Video”.");
    lastTitle = tab.title || "YouTube Summary";
  } else {
    summariseBtn.disabled = true;
    setStatus("Open a YouTube video and reopen this popup.");
  }
});

summariseBtn.addEventListener("click", () => {
  summariseBtn.disabled = true;
  downloadBtn.disabled = true;
  setStatus("Summarising video with AI...");

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    const url = tab?.url;

    if (!url || !url.includes("youtube.com/watch")) {
      setStatus("Not a YouTube video URL.");
      summariseBtn.disabled = false;
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/summarise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Backend error");
      }

      lastSummary = data.summary || "";
      if (!lastSummary.trim()) {
        throw new Error("Empty summary received");
      }

      setStatus("Summary ready. Download the PDF.");
      summariseBtn.disabled = false;
      downloadBtn.disabled = false;
    } catch (err) {
      console.error(err);
      setStatus("Error: " + err.message);
      summariseBtn.disabled = false;
    }
  });
});

downloadBtn.addEventListener("click", () => {
  if (!lastSummary) {
    setStatus("No summary available to download.");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    console.error("[popup] jsPDF not loaded:", window.jspdf);
    setStatus("Error: PDF library not loaded.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const margin = 40;
  const lineHeight = 14;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;

  let y = margin;

  function addPageIfNeeded(extra = lineHeight) {
    if (y + extra > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function cleanInlineMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")   // **bold**
      .replace(/__(.*?)__/g, "$1")       // __bold__
      .replace(/`([^`]+)`/g, "$1")       // `code`
      .replace(/\*(.*?)\*/g, "$1");      // *emphasis*
  }

  const summaryLines = lastSummary.split("\n");

  // ---- Title from lastTitle ----
  const safeTitle = (lastTitle || "YouTube Summary").replace(/[\n\r]+/g, " ");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);

  const titleLines = doc.splitTextToSize(safeTitle, maxWidth);
  addPageIfNeeded(titleLines.length * lineHeight);
  doc.text(titleLines, margin, y);
  y += titleLines.length * lineHeight + lineHeight;

  // ---- Body (markdown → styled) ----
  summaryLines.forEach((rawLine) => {
    const line = rawLine.trim();

    // Blank line = spacing
    if (line === "") {
      y += lineHeight;
      return;
    }

    // Horizontal rule like --- or ***
    if (/^[-*_]{3,}$/.test(line)) {
      addPageIfNeeded(lineHeight * 1.5);
      y += lineHeight / 2;
      // optional: draw a subtle line
      doc.setDrawColor(180);
      doc.line(margin, y, pageWidth - margin, y);
      y += lineHeight;
      return;
    }

    // Headings
    if (line.startsWith("# ")) {
      const text = cleanInlineMarkdown(line.replace(/^#\s+/, ""));
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);

      const hLines = doc.splitTextToSize(text, maxWidth);
      addPageIfNeeded(hLines.length * lineHeight + lineHeight);
      y += lineHeight; // extra top spacing
      doc.text(hLines, margin, y);
      y += hLines.length * lineHeight;
      return;
    }

    if (line.startsWith("## ")) {
      const text = cleanInlineMarkdown(line.replace(/^##\s+/, ""));
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);

      const hLines = doc.splitTextToSize(text, maxWidth);
      addPageIfNeeded(hLines.length * lineHeight + lineHeight);
      y += lineHeight; // extra spacing
      doc.text(hLines, margin, y);
      y += hLines.length * lineHeight;
      return;
    }

    if (line.startsWith("### ")) {
      const text = cleanInlineMarkdown(line.replace(/^###\s+/, ""));
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);

      const hLines = doc.splitTextToSize(text, maxWidth);
      addPageIfNeeded(hLines.length * lineHeight + lineHeight / 2);
      y += lineHeight / 2;
      doc.text(hLines, margin, y);
      y += hLines.length * lineHeight;
      return;
    }

    // Bullet points: "- " or "* "
    if (/^[-*]\s+/.test(line)) {
      const bulletText = cleanInlineMarkdown(line.replace(/^[-*]\s+/, ""));
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);

      const bulletPrefix = "• ";
      const bulletLines = doc.splitTextToSize(
        bulletPrefix + bulletText,
        maxWidth - 15
      );

      addPageIfNeeded(bulletLines.length * lineHeight);
      // small indent for bullets
      doc.text(bulletLines, margin + 10, y);
      y += bulletLines.length * lineHeight;
      return;
    }

    // Default paragraph
    const paragraph = cleanInlineMarkdown(line);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);

    const pLines = doc.splitTextToSize(paragraph, maxWidth);
    addPageIfNeeded(pLines.length * lineHeight);
    doc.text(pLines, margin, y);
    y += pLines.length * lineHeight;
  });

  const filenameSafeTitle = safeTitle.replace(/[^\w\d]+/g, "_").slice(0, 40);
  const filename = `${filenameSafeTitle || "youtube_summary"}.pdf`;

  console.log("[popup] Saving PDF as", filename);
  doc.save(filename);
  setStatus("PDF downloaded ✅");
});

