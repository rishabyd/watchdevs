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
      thumbnailKey: true,
      viewCount: true,
      duration: true,
      createdAt: true,
      user: {
        select: {
          profileUsername: true,
          name: true,
          image: true,
        },
      },
    },
  });

  const cleanData = data.map((video) => ({
    id: video.id,
    creatorId: video.userId,
    title: video.title,
    thumbnailKey: video.thumbnailKey,
    viewCount: Number(video.viewCount),
    duration: video.duration,
    creatorName: video.user.name,
    creatorUsername: video.user.profileUsername,
    createdAt: video.createdAt.toISOString(),
    creatorAvatar: video.user.image,
  }));

  return cleanData;
}

export default async function HomePage() {
  const initialData = await getVideoFeed(0, 20);

  return (
    <div className="p-3 mt-14 scroll-smooth w-full">
      <FeedClient initialData={initialData} />
    </div>
  );
}
