import { prisma } from "@repo/db";
import { FeedClient } from "@/components/content/feed";
import { CACHE_KEYS, redis } from "@/lib/cache/redis";

async function getVideoFeed(page = 0, limit = 20) {
  const cacheKey = CACHE_KEYS.videoFeed(page);

  // Try Redis cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("Cache hit for page", page);
    return cached as typeof cleanData;
  }

  console.log("Cache miss - fetching from DB");

  // Cache miss - fetch from database with pagination
  const data = await prisma.video.findMany({
    where: { visibility: "PUBLIC" },
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
      bunnyVideoId: true,
      bunnyLibraryId: true,
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
    viewCount: Number(video.viewCount),
    duration: video.duration,
    bunnyVideoId: video.bunnyVideoId,
    bunnyLibraryId: video.bunnyLibraryId,
    creatorName: video.user.name || video.user.username,
    creatorUsername: video.user.username,
    createdAt: video.createdAt.toISOString(),
  }));

  // Store in Redis with 2 minute TTL
  await redis.setex(cacheKey, 120, JSON.stringify(cleanData));

  return cleanData;
}

export default async function DashboardPage() {
  const initialData = await getVideoFeed(0, 20);

  return (
    <div className="p-3 w-full">
      <FeedClient initialData={initialData} />
    </div>
  );
}
