import VideoCard from "@/components/content/video-card";
import { prisma } from "@repo/db";

export default async function DashboardPage() {
  const data = await prisma.video.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
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
    createdAt: video.createdAt,
  }));

  return (
    <div className="flex flex-1 mt-9 flex-col gap-6 p-6">
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cleanData.map((video) => (
          <VideoCard
            creatorUsername={video.creatorUsername}
            key={video.id}
            id={video.id}
            thumbnailKey={video.thumbnailKey}
            title={video.title}
            description={video.description}
            creatorId={video.creatorId}
            creatorName={video.creatorName}
            playbackId={video.playbackId}
            userId={video.creatorId}
            duration={video.duration}
            viewCount={video.viewCount}
            createdAt={video.createdAt}
          />
        ))}
      </div>

      {/* Empty state */}
      {cleanData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No videos available yet
        </div>
      )}
    </div>
  );
}
