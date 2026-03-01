// File Upload Module
import { uploadToGitHub } from './api.js';
import { updateTrack } from './state.js';

export async function handleFileUpload(file, trackId, addLog) {
  if (!file) return null;

  addLog(`Uploading ${file.name} to GitHub...`, "info");
  
  const url = await uploadToGitHub(file, addLog);
  
  if (url) {
    updateTrack(trackId, "url", url);
  }
  
  return url;
}

export function setupFileUploadListeners(trackCard, trackId, onFileUpload) {
  const uploadBtn = trackCard.querySelector(".upload-btn");
  const fileInput = trackCard.querySelector(".file-input");
  const urlInput = trackCard.querySelector(".track-url");

  uploadBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";
    
    const url = await onFileUpload(file, trackId);
    
    uploadBtn.disabled = false;
    uploadBtn.textContent = "📤 Upload";
    fileInput.value = "";
    
    if (url) {
      urlInput.value = url;
    }
  });
}
