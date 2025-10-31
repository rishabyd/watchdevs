"use client";

import VideoPlayer from "@/components/content/video-player";
import { prisma } from "@repo/db";
import { Button } from "@workspace/ui/components/button";
import { Github } from "@workspace/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
      bunnyVideoId: true,
      bunnyLibraryId: true,
      viewCount: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          profileUsername: true, // Fixed: lowercase
          githubUsername: true,
          image: true,
        },
      },
    },
  });

  if (!video || !video.bunnyVideoId) {
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
        bunnyVideoId={video.bunnyVideoId}
        bunnyLibraryId={video.bunnyLibraryId!}
        title={video.title}
        userId={video.user.id}
      />

      <div className="space-y-4 mt-3 px-16">
        <h1 className="text-2xl font-bold">{video.title}</h1>
        <div className="flex">
          <div className="flex-4/6 w-full">
            {/* Creator Card - No nested Links */}
            <CreatorCard user={video.user} />

            {/* Video Details */}
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

// Separate component to handle creator card
function CreatorCard({
  user,
}: {
  user: {
    id: string;
    name: string | null;
    profileUsername: string | null;
    githubUsername: string | null;
    image: string | null;
  };
}) {
  const router = useRouter();

  return (
    <div
      onClick={() =>
        user.profileUsername && router.push(`/${user.profileUsername}`)
      }
      className="flex items-center px-4 border gap-3 p-2 cursor-pointer hover:bg-muted/50 transition"
    >
      {/* Profile Image */}
      {user.image && (
        <img
          src={user.image}
          alt={user.name || ""}
          className="w-10 h-10 rounded-full"
        />
      )}

      {/* Creator Info */}
      <div className="flex-col gap-0">
        <p className="font-medium text-lg p-0">{user.name}</p>
      </div>

      {/* GitHub Link - Only this is a Link */}
      {user.githubUsername && (
        <Link
          href={`https://github.com/${user.githubUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()} // Prevent profile nav
          className="ml-auto"
        >
          <Button variant="secondary">
            <Github />
            {user.githubUsername}
          </Button>
        </Link>
      )}

      {/* Follow Button */}
      <Button
        variant="default"
        onClick={(e) => e.stopPropagation()} // Prevent profile nav
      >
        Follow
      </Button>
    </div>
  );
}
