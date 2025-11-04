import VideoCard from "@/components/content/video-card";
import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { Search } from "@workspace/ui/icons";
import { headers } from "next/headers";

interface SearchParamsProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchResultsPage({
  searchParams,
}: SearchParamsProps) {
  const params = await searchParams;
  const q = params.q || "";
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const videos = await prisma.video.findMany({
    where: {
      visibility: "PUBLIC",
      status: "READY",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { githubUsername: { contains: q, mode: "insensitive" } } },
        { user: { profileUsername: { contains: q, mode: "insensitive" } } },
        { category: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: [q] } },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      duration: true,
      viewCount: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          name: true,
          githubUsername: true,
          profileUsername: true,
          image: true,
        },
      },
    },
    take: 30,
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className=" ">
      {/* Results */}
      <div className="max-w-7xl mx-auto  ">
        {videos.length === 0 ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No videos found</h2>
              <p className="text-muted-foreground">
                Try searching with different keywords
              </p>
            </div>
          </div>
        ) : (
          <div className="flex mt-14 min-h-screen px-4 py-4 flex-col gap-3">
            {videos.map((video) => (
              <VideoCard
                creatorAvatar={video.user.image!}
                viewMode="rectangle"
                key={video.id}
                id={video.id}
                thumbnailKey={video.thumbnailKey}
                title={video.title}
                description={video.description}
                creatorId={video.userId}
                creatorUsername={video.user.profileUsername!}
                creatorName={video.user.name || undefined}
                userId={video.userId}
                duration={video.duration}
                viewCount={video.viewCount}
                createdAt={video.createdAt.toISOString()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
