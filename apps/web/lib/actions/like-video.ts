"use server";

import { headers } from "next/headers";
import { auth } from "../auth";
import { prisma } from "@repo/db";

export async function likeVideoAction(videoId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { message: "unauthenticated request", success: false };
    }

    const userId = session.user.id;
    const existingLike = await prisma.videoLike.findFirst({
      where: { videoId, userId },
    });

    if (existingLike) {
      // Unlike
      await Promise.all([
        prisma.videoLike.delete({
          where: { videoId_userId: { videoId, userId } },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);

      return { message: "Like removed", success: true };
    } else {
      // Like
      await Promise.all([
        prisma.videoLike.create({
          data: { userId, videoId },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      return { message: "Like successful", success: true };
    }
  } catch (error) {
    throw new Error("Failed to toggle like");
  }
}
