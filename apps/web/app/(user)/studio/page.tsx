"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import * as tus from "tus-js-client";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Textarea } from "@workspace/ui/components/textarea";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Progress } from "@workspace/ui/components/progress";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { Upload, X, Video, Loader2 } from "@workspace/ui/icons";
import { Label } from "@workspace/ui/components/label";
import { Badge } from "@workspace/ui/components/badge";

interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  category: string;
  visibility: "public" | "unlisted" | "private";
  thumbnail?: File;
}

const VISIBILITY_OPTIONS = [
  {
    value: "public" as const,
    label: "Public",
    desc: "Anyone can watch your video",
  },
  {
    value: "private" as const,
    label: "Private",
    desc: "Only you can watch",
  },
];

const CATEGORIES = [
  { value: "tutorial", label: "Tutorial" },
  { value: "project", label: "Project Showcase" },
  { value: "web-dev", label: "Web Development" },
  { value: "mobile-dev", label: "Mobile Development" },
  { value: "devops", label: "DevOps" },
  { value: "other", label: "Other" },
];

export default function StudioUpload() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "details" | "uploading">(
    "select",
  );

  const [file, setFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: "",
    description: "",
    tags: [],
    category: "",
    visibility: "public",
  });

  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("video/")) {
        setError("Please select a valid video file");
        return;
      }

      const MAX_SIZE = 5 * 1024 * 1024 * 1024;
      if (selectedFile.size > MAX_SIZE) {
        setError("Video too large. Maximum size is 5GB");
        return;
      }

      setFile(selectedFile);
      const titleFromFile = selectedFile.name.replace(/\.[^/.]+$/, "");
      setMetadata((prev) => ({ ...prev, title: titleFromFile }));
      setStep("details");
      setError(null);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("Thumbnail too large. Maximum size is 10MB");
      return;
    }

    setMetadata((prev) => ({ ...prev, thumbnail: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

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

  const removeTag = (tagToRemove: string) => {
    setMetadata((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const canUpload = () => {
    return (
      metadata.title.trim().length >= 3 &&
      metadata.description.trim().length >= 10 &&
      metadata.category &&
      metadata.thumbnail &&
      file
    );
  };

  const uploadVideo = async () => {
    if (!file || !metadata.thumbnail || !canUpload()) return;

    setStep("uploading");
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Compress thumbnail
      setProgress(5);
      const compressedThumbnail = await imageCompression(metadata.thumbnail, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.8,
      });

      console.log(
        `Thumbnail: ${(metadata.thumbnail.size / 1024).toFixed(0)}KB → ${(compressedThumbnail.size / 1024).toFixed(0)}KB`,
      );

      // Step 2: Create video + get presigned upload URLs
      setProgress(10);
      const createResponse = await fetch("/api/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          tags: metadata.tags,
          visibility: metadata.visibility,
          thumbnailFileName: compressedThumbnail.name || "thumbnail.webp",
          thumbnailFileType: compressedThumbnail.type,
          thumbnailFileSize: compressedThumbnail.size,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create video");
      }

      const response = await createResponse.json();
      const { videoId, uploadUrls, bunny } = response;

      if (!bunny || !bunny.tus) {
        throw new Error("Invalid upload configuration from server");
      }

      // Step 3: Upload thumbnail to R2 (fast, small file)
      setProgress(15);
      const thumbnailUploadPromise = fetch(uploadUrls.thumbnail, {
        method: "PUT",
        body: compressedThumbnail,
        headers: { "Content-Type": compressedThumbnail.type },
      }).then((res) => {
        if (!res.ok) throw new Error("Thumbnail upload failed");
      });

      // Step 4: Upload video to Bunny via TUS (direct, resumable)
      setProgress(20);
      const videoUploadPromise = new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: bunny.tus.endpoint,
          headers: bunny.tus.headers,
          uploadSize: file.size,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          onError: (err: Error) => {
            console.error("TUS upload error:", err);
            reject(err);
          },
          onProgress: (bytesSent: number, bytesTotal: number) => {
            const pct = (bytesSent / bytesTotal) * 100;
            // Map to 20–95% range
            setProgress(20 + Math.round(pct * 0.75));
          },
          onSuccess: () => {
            console.log("Video uploaded to Bunny successfully");
            resolve();
          },
        });

        // Resume from previous upload if available
        upload.findPreviousUploads().then((prev) => {
          if (prev.length) {
            console.log("Resuming previous upload");
            upload.resumeFromPreviousUpload(prev[0]!);
          }
          upload.start();
        });
      });

      // Wait for both uploads to complete
      await Promise.all([thumbnailUploadPromise, videoUploadPromise]);

      setProgress(100);
      setTimeout(() => {
        router.push(`/`);
      }, 1000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setStep("details");
    }
  };

  // Render file selection step
  if (step === "select") {
    return (
      <div className="max-w-4xl mt-14 mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Upload Video</h1>
        <p className="text-muted-foreground mb-8">
          Share your content with the dev community
        </p>

        <Card className="border-2 duration-500 border-dashed hover:border-primary transition-colors cursor-pointer rounded-none">
          <CardContent className="p-12">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold">
                    Select video to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Or drag and drop a video file (max 5GB)
                  </p>
                </div>
                <Button className="rounded-none" size="lg">
                  Select File
                </Button>
              </div>
            </label>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Render details step
  if (step === "details") {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="link"
            onClick={() => {
              setStep("select");
              setFile(null);
              setThumbnailPreview(null);
              setMetadata({
                title: "",
                description: "",
                tags: [],
                category: "",
                visibility: "public",
              });
            }}
            className="px-0"
          >
            ← Change video
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Video Details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={metadata.title}
                onChange={(e) =>
                  setMetadata({ ...metadata, title: e.target.value })
                }
                className="rounded-none"
                placeholder="Add a title that describes your video"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {metadata.title.length}/100
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) =>
                  setMetadata({ ...metadata, description: e.target.value })
                }
                placeholder="Tell viewers about your video"
                rows={6}
                maxLength={5000}
                className="resize-none rounded-none"
              />
              <p className="text-xs text-muted-foreground">
                {metadata.description.length}/5000
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={metadata.category}
                onValueChange={(value) =>
                  setMetadata({ ...metadata, category: value })
                }
              >
                <SelectTrigger
                  className="rounded-none cursor-pointer"
                  id="category"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {CATEGORIES.map((cat) => (
                    <SelectItem
                      className="rounded-none"
                      key={cat.value}
                      value={cat.value}
                    >
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (Max 10)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  type="text"
                  className="rounded-none"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tags (press Enter)"
                  disabled={metadata.tags.length >= 10}
                />
                <Button
                  className="rounded-none"
                  type="button"
                  onClick={addTag}
                  disabled={metadata.tags.length >= 10 || !tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag) => (
                  <Badge key={tag} className="p-0 rounded-none">
                    <Button
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive border-none bg-transparent rounded-none cursor-pointer"
                    >
                      {tag}
                      <X />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <Label>Visibility</Label>
              <RadioGroup
                value={metadata.visibility}
                onValueChange={(value) =>
                  setMetadata({
                    ...metadata,
                    visibility: value as VideoMetadata["visibility"],
                  })
                }
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={option.value}
                    className="flex items-start p-2 px-4 gap-3 border rounded-none cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="h-full flex items-center justify-center">
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="bg-transparent"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Custom Thumbnail - REQUIRED */}
            <div className="space-y-2">
              <Label>
                Thumbnail <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a custom thumbnail for your video
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
                id="thumbnail-upload"
              />
              <Button variant="outline" className="rounded-none" asChild>
                <label htmlFor="thumbnail-upload" className="cursor-pointer">
                  {metadata.thumbnail ? "Change Thumbnail" : "Upload Thumbnail"}
                </label>
              </Button>
              {thumbnailPreview && (
                <div className="mt-3">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-48 h-27 object-cover rounded-none border"
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
                <Card className="rounded-none">
                  <CardContent className="p-4 space-y-3">
                    <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden">
                      {thumbnailPreview ? (
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">
                            Upload thumbnail
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm line-clamp-2">
                      {metadata.title || "Untitled Video"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={uploadVideo}
                  disabled={!canUpload()}
                  className="w-full rounded-none"
                  size="lg"
                >
                  Publish Video
                </Button>
                {!metadata.thumbnail && (
                  <p className="text-xs text-destructive text-center">
                    Thumbnail required to publish
                  </p>
                )}
                <p className="text-xs text-muted-foreground text-center">
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
        <p className="text-muted-foreground">
          Please don't close this page while uploading
        </p>

        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <p className="text-lg font-semibold">{progress}%</p>
          {progress < 20 && (
            <p className="text-sm text-muted-foreground">Preparing upload...</p>
          )}
          {progress >= 20 && progress < 95 && (
            <p className="text-sm text-muted-foreground">Uploading video...</p>
          )}
          {progress >= 95 && (
            <p className="text-sm text-muted-foreground">Finalizing...</p>
          )}
        </div>

        {progress === 100 && (
          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Upload successful! Redirecting to home...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <p className="mb-2">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep("details");
                  setError(null);
                }}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
