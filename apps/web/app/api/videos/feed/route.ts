import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "0");
  const limit = 20;

  const data = await prisma.video.findMany({
    where: { visibility: "PUBLIC", status: "READY" },
    orderBy: { createdAt: "desc" },
    skip: page * limit,
    take: limit,
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      thumbnailKey: true,
      viewCount: true,
      duration: true,
      bunnyLibraryId: true,
      bunnyVideoId: true,
      createdAt: true,
      user: {
        select: {
          githubUsername: true,
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
    description: video.description,
    thumbnailKey: video.thumbnailKey,
    viewCount: video.viewCount,
    duration: video.duration,
    bunnyVideoId: video.bunnyVideoId,
    bunnyLibraryId: video.bunnyLibraryId,
    creatorName: video.user.name,
    creatorUsername: video.user.profileUsername,
    creatorGithubUsername: video.user.githubUsername,
    createdAt: video.createdAt.toISOString(),
    creatorAvatar: video.user.image,
  }));

  return NextResponse.json(cleanData);
}
