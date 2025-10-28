"use client";

import { useState } from "react";

export default function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith("video/")) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please select a valid video file");
      }
    }
  };

  const uploadToMux = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get upload URL from your backend
      const response = await fetch("/api/mux/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, assetId } = await response.json();

      // Step 2: Upload directly to Mux with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          // Step 3: Save to database
          await fetch("/api/videos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              muxAssetId: assetId,
              filename: file.name,
              status: "processing",
            }),
          });

          setSuccess(true);
          setUploading(false);
        } else {
          throw new Error("Upload failed");
        }
      });

      xhr.addEventListener("error", () => {
        throw new Error("Network error during upload");
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Upload Video</h2>

        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50"
        />

        {file && !uploading && !success && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
            <button
              onClick={uploadToMux}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 transition-colors"
            >
              Upload to Mux
            </button>
          </div>
        )}

        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">Uploading: {progress}%</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">
              ✓ Video uploaded successfully! Processing will complete shortly.
            </p>
            <button
              onClick={() => {
                setFile(null);
                setSuccess(false);
                setProgress(0);
              }}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Upload another video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
