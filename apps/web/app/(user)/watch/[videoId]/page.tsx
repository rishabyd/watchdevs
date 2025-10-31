import VideoPlayer from "@/components/content/video-player";
import { prisma } from "@repo/db";
import Link from "next/link";
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
      bunnyVideoId: true,
      bunnyLibraryId: true,
      viewCount: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          ProfileUsername: true,
          GithubUsername: true,
          image: true,
        },
      },
    },
  });

  // If video doesn't exist, show 404
  if (!video || !video.bunnyVideoId) {
    notFound();
  }

  // Increment view count (optional, run in background)
  prisma.video
    .update({
      where: { id: videoId },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  return (
    <div className="flex flex-1 mt-14 flex-col justify-center   ">
      {/* Video Player */}
      <VideoPlayer
        bunnyVideoId={video.bunnyVideoId}
        bunnyLibraryId={video.bunnyLibraryId!}
        title={video.title}
        userId={video.user.id}
      />

      {/* Video Info */}
      <div className="space-y-4 mt-3 px-16 ">
        <h1 className="text-2xl font-bold">{video.title}</h1>
        <div className="flex items-center  border gap-3 p-2 ">
          {video.user.image && (
            <img
              src={video.user.image}
              alt={video.user.name || ""}
              className="w-10 h-10 "
            />
          )}
          <div className=" flex-col  gap-0">
            <p className="font-medium h-5 text-lg p-0">{video.user.name}</p>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              className="p-0 hover:text-blue-400 text-sm text-foreground/50 duration-300"
              href={`https://github.com/${video.user.GithubUsername}`}
            >
              {video.user.GithubUsername}
            </Link>
          </div>
        </div>
        {video.description && (
          <p className="text-muted-foreground">{video.description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {new Date(video.createdAt).toLocaleDateString()}
        </p>
        <p className="text-sm text-muted-foreground">
          {Number(video.viewCount).toLocaleString()} views
        </p>

        {/* Creator Info */}
      </div>
    </div>
  );
}
