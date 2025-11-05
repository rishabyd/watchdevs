"use server";

import { headers } from "next/headers";
import { auth } from "../auth";
import { prisma } from "@repo/db";

export async function followCreatorAction(creatorId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { message: "unauthenticated request", success: false };
    }

    const userId = session.user.id;

    if (userId === creatorId) {
      return { message: "Cannot follow yourself!", success: false };
    }

    // Check if already following
    const existingFollow = await prisma.follow.findFirst({
      where: { followerId: userId, followingId: creatorId },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: creatorId,
          },
        },
      });
      return { message: "Unfollowed", success: true };
    } else {
      // Follow
      await prisma.follow.create({
        data: { followerId: userId, followingId: creatorId },
      });
      return { message: "Successfully followed", success: true };
    }
  } catch (error) {
    throw new Error("Failed to verify session");
  }
}
