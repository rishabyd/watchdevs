"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  category: string;
  visibility: "public" | "unlisted" | "private";
  thumbnail?: File;
}

export default function StudioUpload() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "details" | "uploading">(
    "select",
  );

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Metadata state
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: "",
    description: "",
    tags: [],
    category: "",
    visibility: "public",
  });

  // Tag input state
  const [tagInput, setTagInput] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Handle video file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith("video/")) {
        setFile(selectedFile);
        // Auto-populate title from filename
        const titleFromFile = selectedFile.name.replace(/\.[^/.]+$/, "");
        setMetadata((prev) => ({ ...prev, title: titleFromFile }));
        setStep("details");
        setError(null);
      } else {
        setError("Please select a valid video file");
      }
    }
  };

  // Handle custom thumbnail upload
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setMetadata((prev) => ({ ...prev, thumbnail: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle tag addition
  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (
      trimmedTag &&
      !metadata.tags.includes(trimmedTag) &&
      metadata.tags.length < 10
    ) {
      setMetadata((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setMetadata((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Validate metadata before upload
  const canUpload = () => {
    return (
      metadata.title.trim().length >= 3 &&
      metadata.description.trim().length >= 10 &&
      metadata.category &&
      file
    );
  };

  // Upload to Mux
  const uploadVideo = async () => {
    if (!file || !canUpload()) return;

    setStep("uploading");
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get upload URL from backend
      const response = await fetch("/api/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to get upload URL");

      const { uploadUrl, assetId } = await response.json();

      // Step 2: Upload to Mux with progress
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          // Step 3: Save video + metadata to database
          const videoData = new FormData();
          videoData.append("muxAssetId", assetId);
          videoData.append("title", metadata.title);
          videoData.append("description", metadata.description);
          videoData.append("tags", JSON.stringify(metadata.tags));
          videoData.append("category", metadata.category);
          videoData.append("visibility", metadata.visibility);
          videoData.append("filename", file.name);

          if (metadata.thumbnail) {
            videoData.append("thumbnail", metadata.thumbnail);
          }

          const saveResponse = await fetch("/api/videos", {
            method: "POST",
            body: videoData,
          });

          if (!saveResponse.ok) throw new Error("Failed to save video");

          const { videoId } = await saveResponse.json();

          // Redirect to video page or dashboard
          router.push(`/studio/videos/${videoId}`);
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
      setStep("details");
    }
  };

  // Render file selection step
  if (step === "select") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Upload Video</h1>
        <p className="text-gray-600 mb-8">
          Share your content with the dev community
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
            id="video-upload"
          />
          <label htmlFor="video-upload" className="cursor-pointer">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-xl font-semibold mb-2">Select video to upload</p>
            <p className="text-sm text-gray-500">
              Or drag and drop a video file
            </p>
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Select File
            </button>
          </label>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Render details step
  if (step === "details") {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => {
              setStep("select");
              setFile(null);
              setMetadata({
                title: "",
                description: "",
                tags: [],
                category: "",
                visibility: "public",
              });
            }}
            className="text-blue-600 hover:underline flex items-center gap-2"
          >
            ← Change video
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Video Details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) =>
                  setMetadata({ ...metadata, title: e.target.value })
                }
                placeholder="Add a title that describes your video"
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {metadata.title.length}/100
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={metadata.description}
                onChange={(e) =>
                  setMetadata({ ...metadata, description: e.target.value })
                }
                placeholder="Tell viewers about your video"
                rows={6}
                maxLength={5000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {metadata.description.length}/5000
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={metadata.category}
                onChange={(e) =>
                  setMetadata({ ...metadata, category: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                <option value="web-dev">Web Development</option>
                <option value="mobile-dev">Mobile Development</option>
                <option value="data-science">Data Science & ML</option>
                <option value="devops">DevOps & Infrastructure</option>
                <option value="programming">Programming & Algorithms</option>
                <option value="career">Career & Interview Prep</option>
                <option value="tools">Tools & Productivity</option>
                <option value="tutorial">Tutorial</option>
                <option value="project">Project Showcase</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Tags (Max 10)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  placeholder="Add tags (press Enter)"
                  disabled={metadata.tags.length >= 10}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  onClick={addTag}
                  disabled={metadata.tags.length >= 10 || !tagInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                {[
                  {
                    value: "public",
                    label: "Public",
                    desc: "Anyone can watch your video",
                  },
                  {
                    value: "unlisted",
                    label: "Unlisted",
                    desc: "Anyone with the link can watch",
                  },
                  {
                    value: "private",
                    label: "Private",
                    desc: "Only you can watch",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={metadata.visibility === option.value}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          visibility: e.target.value as any,
                        })
                      }
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Thumbnail */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Custom Thumbnail (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
                id="thumbnail-upload"
              />
              <label
                htmlFor="thumbnail-upload"
                className="inline-block px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                {metadata.thumbnail ? "Change Thumbnail" : "Upload Thumbnail"}
              </label>
              {thumbnailPreview && (
                <div className="mt-3">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-48 h-27 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Preview</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="aspect-video bg-gray-200 rounded mb-3 flex items-center justify-center">
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail"
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="font-medium text-sm line-clamp-2">
                    {metadata.title || "Untitled Video"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={uploadVideo}
                  disabled={!canUpload()}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Publish Video
                </button>
                <p className="text-xs text-gray-500 text-center">
                  By publishing, you agree to our terms of service
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render uploading step
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Uploading Video</h1>
        <p className="text-gray-600">Please don't close this page</p>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-lg font-semibold">{progress}%</p>

        {progress === 100 && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Processing...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setStep("details")}
              className="mt-2 text-blue-600 hover:underline text-sm"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
