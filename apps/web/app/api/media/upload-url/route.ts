// app/api/media/upload-url/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "@/lib/r2/r2";
import { toUpperCase } from "better-auth";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
    const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      return NextResponse.json(
        { error: "Mux credentials not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();

    // Validate metadata
    const {
      title,
      description,
      visibility,
      category,
      tags,
      thumbnailFileName,
      thumbnailFileType,
      thumbnailFileSize,
    } = body;

    // Validate required fields
    if (!title || title.length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters" },
        { status: 400 },
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: "Title too long (max 100 characters)" },
        { status: 400 },
      );
    }

    if (description && description.length > 5000) {
      return NextResponse.json(
        { error: "Description too long (max 5000 characters)" },
        { status: 400 },
      );
    }

    if (!["public", "private", "unlisted"].includes(visibility)) {
      return NextResponse.json(
        { error: "Invalid visibility" },
        { status: 400 },
      );
    }

    // Validate thumbnail file
    const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    if (!thumbnailFileName || !thumbnailFileType || !thumbnailFileSize) {
      return NextResponse.json(
        { error: "Thumbnail file information required" },
        { status: 400 },
      );
    }

    if (thumbnailFileSize > MAX_THUMBNAIL_SIZE) {
      return NextResponse.json(
        { error: "Thumbnail too large (max 10MB)" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(thumbnailFileType)) {
      return NextResponse.json(
        { error: "Invalid thumbnail type. Use JPEG, PNG, or WebP" },
        { status: 400 },
      );
    }

    // Generate unique thumbnail key for R2
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const ext = thumbnailFileType.split("/")[1];
    const thumbnailKey = `thumbnails/${timestamp}-${randomId}.${ext}`;

    // Create R2 presigned upload URL
    const r2Command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: thumbnailKey,
      ContentType: thumbnailFileType,
      ContentLength: thumbnailFileSize,
      CacheControl: "public, max-age=31536000, immutable",
    });

    const thumbnailUploadUrl = await getSignedUrl(r2Client, r2Command, {
      expiresIn: 600, // 10 minutes
    });

    // Create Mux direct upload URL
    const muxResponse = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)}`,
      },
      body: JSON.stringify({
        new_asset_settings: {
          playback_policies: ["public"],
          video_quality: "basic",
        },
        cors_origin: "*",
        test: false,
      }),
    });

    if (!muxResponse.ok) {
      const error = await muxResponse.text();
      console.error("Mux API error:", error);
      return NextResponse.json(
        { error: "Failed to create Mux upload URL" },
        { status: muxResponse.status },
      );
    }

    const muxData = await muxResponse.json();
    // Create video record in database
    const video = await prisma.video.create({
      data: {
        muxUploadId: muxData.data.id,
        userId: session.user.id,
        visibility: visibility.toUpperCase(),
        status: "PENDING",
        title: title,
        description: description || "",
        category: category || "uncategorized",
        tags: tags || [],
        thumbnailKey: thumbnailKey,
      },
    });
    console.log(`✅ Created video ${video.id} for user ${session.user.id}`);

    // Return both upload URLs
    return NextResponse.json({
      success: true,
      videoId: video.id,
      uploadUrls: {
        thumbnail: thumbnailUploadUrl,
        video: muxData.data.url,
      },
    });
  } catch (error) {
    console.error("Upload URL creation failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
