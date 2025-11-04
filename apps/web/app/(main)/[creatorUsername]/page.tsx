import VideoCard from "@/components/content/video-card";
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
      videos: true,
      githubUsername: true,
      bio: true,
      image: true,
      name: true,
      _count: { select: { videos: true, followers: true } },
    },
  });
  const isMe = session?.user.id === userData?.id;

  return (
    <div className="mt-14">
      <div className="h-80 px-52 pt-36 gap-5 flex">
        <div className="flex-col flex gap-3 items-center cursor-pointer   w-fit ">
          <Avatar className="w-36 h-36">
            <AvatarImage src={userData?.image!} alt={userData?.name!} />
            <AvatarFallback className="rounded-full">
              {userData?.name!.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {isMe ? null : (
            <div>
              <Button size={"lg"} className="text-lg">
                Follow
              </Button>
            </div>
          )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 px-10 lg:grid-cols-5 gap-4">
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
