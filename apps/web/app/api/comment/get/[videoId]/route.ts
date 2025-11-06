import { prisma } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    videoId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { videoId } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    const currentUserId = session?.user?.id;

    // Get pagination params from URL
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = page * limit;

    // Fetch comments with user data and pagination
    const comments = await prisma.comment.findMany({
      where: {
        videoId: videoId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileUsername: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: skip,
      take: limit,
    });

    // Format response with proper structure
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      userId: comment.userId,
      userName:
        comment.user.name || comment.user.profileUsername || "Anonymous",
      userAvatar: comment.user.image || undefined,
      likeCount: comment.likeCount,
      isLiked: false, // TODO: Implement like tracking
    }));

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}
