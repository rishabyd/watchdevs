import VideoPlayer from "@/components/content/video-player";
import { prisma } from "@repo/db";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ videoId: string }>;
};

export default async function VideoPage({ params }: PageProps) {
  const { videoId } = await params;

  // Fetch video from database
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      description: true,
      muxPlaybackId: true,
      duration: true,
      viewCount: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  });

  // If video doesn't exist, show 404
  if (!video || !video.muxPlaybackId) {
    notFound();
  }

  // Increment view count (optional, run in background)
  prisma.video
    .update({
      where: { id: videoId },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {}); // Don't block render if this fails

  return (
    <div className="flex flex-1 mt-9 flex-col max-w-7xl mx-auto p-6 gap-6">
      {/* Video Player */}
      <VideoPlayer
        playbackId={video.muxPlaybackId}
        title={video.title}
        userId={video.user.id}
      />

      {/* Video Info */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{video.title}</h1>

        {video.description && (
          <p className="text-muted-foreground ">{video.description}</p>
        )}
        {new Date(video.createdAt).toLocaleDateString()}
        <p className="text-sm text-muted-foreground">
          {Number(video.viewCount).toLocaleString()} views
        </p>
        {/* Creator Info */}
        <div className="flex items-center gap-3 pt-4 border-t">
          {video.user.image && (
            <img
              src={video.user.image}
              alt={video.user.name || video.user.username}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <p className="font-medium">
              {video.user.name || video.user.username}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
