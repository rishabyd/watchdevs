import CommentSection from "@/components/content/comment-section";
import VideoPlayer from "@/components/content/video-player";
import { CreatorCard } from "@/components/creator/creator-card";
import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { headers } from "next/headers";

import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ videoId: string }>;
};

export default async function VideoPage({ params }: PageProps) {
  const { videoId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
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
  const [isLiked, followCount] = await Promise.all([
    prisma.videoLike.findFirst({
      where: { videoId, userId: video?.user.id },
    }),
    prisma.follow.count({
      where: {
        followerId: session?.user.id!,
        followingId: video?.user?.id!,
      },
    }),
  ]);

  const isFollowing = followCount > 0;
  const isMe = session?.user.id === video?.user.id;
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
          <div className="flex-4/6  w-full">
            <CreatorCard
              isMe={isMe}
              isFollowing={!!isFollowing}
              videoId={videoId}
              user={video.user}
              likeCount={video.likeCount}
              isLiked={!!isLiked}
            />

            <div className="border border-t-0 p-2 px-3">
              <div className="flex items-center gap-2.5">
                <p className="text-sm text-muted-foreground">
                  {Number(video.viewCount).toLocaleString()} views
                </p>

                <p>•</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(video.createdAt).toLocaleDateString()}
                </p>
              </div>{" "}
              {video.description && (
                <p className="text-muted-foreground">{video.description}</p>
              )}
            </div>
            <div className="border  p-2 px-3 border-t-0">
              <CommentSection videoId={video.id} />
            </div>
          </div>
          <div className="flex-2/6">{"videos feed"}</div>
        </div>
      </div>
    </div>
  );
}
