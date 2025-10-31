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
      bunnyLibraryId: true,
      bunnyVideoId: true,
      createdAt: true,
      user: {
        select: {
          GithubUsername: true,
          ProfileUsername: true,
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
    bunnyVideoId: video.bunnyVideoId,
    bunnyLibraryId: video.bunnyLibraryId,
    creatorName: video.user.name,
    creatorUsername: video.user.ProfileUsername,
    creatorGithubUsername: video.user.GithubUsername,
    createdAt: video.createdAt.toISOString(),
  }));

  // Cache for 2 minutes
  await redis.setex(cacheKey, 120, JSON.stringify(cleanData));

  return NextResponse.json(cleanData);
}
