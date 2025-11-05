import VideoCard from "@/components/content/video-card";
import FollowCreatorButton from "@/components/creator/follow-creator";
import GithubButton from "@/components/socials/social";
import { auth } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { prisma } from "@repo/db";
import { Button } from "@workspace/ui/components/button";
import { headers } from "next/headers";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ creatorUsername: string }>;
}) {
  const p = await params;
  const username = p.creatorUsername;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userData = await prisma.user.findUnique({
    where: { profileUsername: username },
    select: {
      id: true,
      videos: {
        select: {
          id: true,
          thumbnailKey: true,
          title: true,
          duration: true,
          viewCount: true,
          createdAt: true,
        },
      },
      githubUsername: true,
      bio: true,
      image: true,
      name: true,
      _count: { select: { videos: true, followers: true } },
    },
  });
  const isFollowing =
    (await prisma.follow.count({
      where: {
        followerId: session?.user.id!,
        followingId: userData?.id!,
      },
    })) > 0;

  return (
    <div className="mt-14 flex-col flex gap-2">
      <div className="h-80 px-52 bg-background pt-24  flex-col flex">
        <div className="flex gap-5">
          <div className="flex-col flex gap-3 items-center cursor-pointer   w-fit ">
            <Avatar className="w-36 h-36">
              <AvatarImage src={userData?.image!} alt={userData?.name!} />
              <AvatarFallback className="rounded-full">
                {userData?.name!.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="pt-4">
            <span className="text-4xl  ">{userData?.name}</span>
            <div className="flex gap-3 mt-1">
              <div className="text-muted-foreground">@{username}</div>
              <div>•</div>
              <div>{userData?._count.followers} Followers</div>
            </div>
            <div className="mt-3">{userData?.bio}</div>
          </div>
        </div>
        <div className="flex gap-3 items-center h-full">
          <FollowCreatorButton
            initialIsFollowing={!!isFollowing}
            size="lg"
            creatorId={userData?.id!}
          />
          <GithubButton
            size={"lg"}
            githubUsername={userData?.githubUsername!}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 px-2 lg:grid-cols-4 gap-2">
        {userData?.videos.map((video) => (
          <VideoCard
            viewMode="square"
            key={video.id}
            creatorUsername={username}
            id={video.id}
            thumbnailKey={video.thumbnailKey}
            title={video.title}
            creatorId={userData.id}
            creatorName={userData.name!}
            userId={userData.id}
            duration={video.duration}
            viewCount={video.viewCount}
            createdAt={video.createdAt.toISOString()}
          />
        ))}
      </div>
    </div>
  );
}
