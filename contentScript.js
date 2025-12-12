// contentScript.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_TRANSCRIPT_FOR_URL") {
    const videoUrl = msg.url;

    // For now just send back URL. Real flow:
    // - You can send this URL to your backend
    // - Backend uses youtube-transcript API to get transcript
    // We'll let popup call the backend instead.
    sendResponse({ ok: true, videoUrl });

    return true;
  }
});
