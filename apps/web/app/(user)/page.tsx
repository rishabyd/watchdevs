import { prisma } from "@repo/db";
import { FeedClient } from "@/components/content/feed";

async function getVideoFeed(page = 0, limit = 20) {
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
      bunnyVideoId: true,
      bunnyLibraryId: true,
      createdAt: true,
      user: {
        select: {
          githubUsername: true,
          profileUsername: true,
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
    creatorName: video.user.name,
    creatorUsername: video.user.profileUsername,
    creatorGithubUsername: video.user.githubUsername,
    createdAt: video.createdAt.toISOString(),
  }));

  // Store in Redis with 2 minute TTL

  return cleanData;
}

export default async function DashboardPage() {
  const initialData = await getVideoFeed(0, 20);

  return (
    <div className="p-3 mt-14 scroll-smooth w-full">
      <FeedClient initialData={initialData} />
    </div>
  );
}
