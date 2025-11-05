import VideoPlayer from "@/components/content/video-player";
import { CreatorCard } from "@/components/creator/creator-card";
import { prisma } from "@repo/db";

import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ videoId: string }>;
};

export default async function VideoPage({ params }: PageProps) {
  const { videoId } = await params;
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      description: true,
      hlsUrl: true,
      viewCount: true,
      createdAt: true,
      likeCount: true,
      user: {
        select: {
          id: true,
          name: true,
          profileUsername: true,
          githubUsername: true,
          image: true,
          _count: { select: { followers: true } },
        },
      },
    },
  });
  const isLiked = await prisma.videoLike.findFirst({
    where: { videoId, userId: video?.user.id },
  });

  if (!video || !video.hlsUrl) {
    notFound();
  }

  prisma.video
    .update({
      where: { id: videoId },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  return (
    <div className="flex flex-1 mt-14 flex-col justify-center">
      <VideoPlayer
        hlsUrl={video.hlsUrl}
        title={video.title}
        userId={video.user.id}
      />

      <div className="space-y-4 mt-3 px-16">
        <h1 className="text-2xl font-bold">{video.title}</h1>
        <div className="flex">
          <div className="flex-4/6 w-full">
            <CreatorCard
              videoId={videoId}
              user={video.user}
              likeCount={video.likeCount}
              isLiked={!!isLiked}
            />

            <div>
              {video.description && (
                <p className="text-muted-foreground">{video.description}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {new Date(video.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {Number(video.viewCount).toLocaleString()} views
              </p>
            </div>
          </div>
          <div className="flex-2/6">{"videos feed"}</div>
        </div>
      </div>
    </div>
  );
}
