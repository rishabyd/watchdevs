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

    await prisma.follow.create({
      data: { followerId: userId, followingId: creatorId },
    });

    return { message: "Successfully followed", success: true };
  } catch (error) {
    throw new Error("Failed to verify session");
  }
}
