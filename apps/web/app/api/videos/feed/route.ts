import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { CACHE_KEYS, redis } from "@/lib/cache/redis";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "0");
  const limit = 20;

  const cacheKey = CACHE_KEYS.videoFeed(page);

  // Check Redis cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch from database
  const data = await prisma.video.findMany({
    where: { visibility: "PUBLIC", status: "READY" },
    orderBy: { createdAt: "desc" },
    skip: page * limit,
    take: limit,
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      thumbnailKey: true,
      viewCount: true,
      duration: true,
      muxPlaybackId: true,
      createdAt: true,
      user: {
        select: {
          username: true,
          name: true,
        },
      },
    },
  });

  const cleanData = data.map((video) => ({
    id: video.id,
    creatorId: video.userId,
    title: video.title,
    description: video.description,
    thumbnailKey: video.thumbnailKey,
    viewCount: video.viewCount,
    duration: video.duration,
    playbackId: video.muxPlaybackId,
    creatorName: video.user.name || video.user.username,
    creatorUsername: video.user.username,
    createdAt: video.createdAt.toISOString(),
  }));

  // Cache for 2 minutes
  await redis.setex(cacheKey, 120, JSON.stringify(cleanData));

  return NextResponse.json(cleanData);
}
