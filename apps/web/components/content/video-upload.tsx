"use client";

import { Button } from "@workspace/ui/components/button";
import { Progress } from "@workspace/ui/components/progress";
import { useState } from "react";

export function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      // Step 1: Create video
      const initRes = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });

      const { videoId, libraryId, apikey } = await initRes.json();

      // Step 2: Upload file directly via PUT
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          console.log("Upload complete!");
          setVideoId(videoId);
          setUploading(false);
        } else {
          alert("Upload failed: " + xhr.responseText);
          setUploading(false);
        }
      });

      xhr.addEventListener("error", () => {
        alert("Upload failed");
        setUploading(false);
      });

      // Direct PUT upload to Bunny
      xhr.open(
        "PUT",
        `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      );
      xhr.setRequestHeader("AccessKey", apikey);
      xhr.send(file);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id="video-input"
          disabled={uploading}
        />
        <label htmlFor="video-input" className="cursor-pointer">
          {file ? (
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Click to select video</p>
          )}
        </label>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center">{progress}% uploaded</p>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? "Uploading..." : "Upload Video"}
      </Button>

      {videoId && (
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="font-medium">Upload successful!</p>
          <p className="text-sm text-gray-600">Video ID: {videoId}</p>
        </div>
      )}
    </div>
  );
}
