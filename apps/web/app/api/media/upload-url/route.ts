// app/api/media/upload-url/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "@/lib/r2/r2";
import crypto from "crypto";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const BUNNY_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
    const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY; // Stream Library API key
    if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
      return NextResponse.json(
        { error: "Bunny Stream credentials not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();
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
    const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024;
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

    // R2 thumbnail presign
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const ext = thumbnailFileType.split("/")[1];
    const thumbnailKey = `thumbnails/${timestamp}-${randomId}.${ext}`;

    const r2Command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: thumbnailKey,
      ContentType: thumbnailFileType,
      ContentLength: thumbnailFileSize,
      CacheControl: "public, max-age=31536000, immutable",
    });
    const thumbnailUploadUrl = await getSignedUrl(r2Client, r2Command, {
      expiresIn: 600,
    });

    // 1) Create Bunny video
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: BUNNY_API_KEY,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      },
    );
    if (!createRes.ok) {
      const error = await createRes.text();
      console.error("Bunny Create Video error:", error);
      return NextResponse.json(
        { error: "Failed to create Bunny video" },
        { status: createRes.status },
      );
    }
    const bunnyVideo = await createRes.json();
    const bunnyVideoId: string =
      bunnyVideo.guid || bunnyVideo.videoId || bunnyVideo.id;
    if (!bunnyVideoId) {
      return NextResponse.json(
        { error: "Missing Bunny videoId in response" },
        { status: 500 },
      );
    }

    // 2) Pre-sign TUS headers (SHA256(libraryId + apiKey + expires + videoId))
    const expires = Math.floor(Date.now() / 1000) + 600; // 10 minutes
    const toSign = `${BUNNY_LIBRARY_ID}${BUNNY_API_KEY}${expires}${bunnyVideoId}`;
    const signature = crypto.createHash("sha256").update(toSign).digest("hex");

    // 3) Persist record
    const video = await prisma.video.create({
      data: {
        bunnyVideoId,
        bunnyLibraryId: BUNNY_LIBRARY_ID,
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

    // 4) Return to client
    return NextResponse.json({
      success: true,
      videoId: video.id,
      uploadUrls: { thumbnail: thumbnailUploadUrl },
      bunny: {
        libraryId: BUNNY_LIBRARY_ID,
        videoId: bunnyVideoId,
        tus: {
          endpoint: "https://video.bunnycdn.com/tusupload",
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: String(expires),
            LibraryId: BUNNY_LIBRARY_ID,
            VideoId: bunnyVideoId,
          },
        },
      },
    });
  } catch (error) {
    console.error("Upload setup failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
