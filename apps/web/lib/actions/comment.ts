"use server";

import { headers } from "next/headers";
import { auth } from "../auth";
import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";

export async function createCommentAction(videoId: string, content: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { message: "Unauthenticated request", success: false };
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return { message: "Comment content is required", success: false };
    }

    if (content.length > 5000) {
      return {
        message: "Comment is too long (max 5000 characters)",
        success: false,
      };
    }

    const userId = session.user.id;
    const trimmedContent = content.trim();

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content: trimmedContent,
          videoId: videoId,
          userId: userId,
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
      });

      // Increment video comment count in same transaction
      await tx.video.update({
        where: { id: videoId },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    revalidatePath(`/watch/${videoId}`);

    return {
      message: "Comment created successfully",
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        userId: comment.userId,
        userName:
          comment.user.name || comment.user.profileUsername || "Anonymous",
        userAvatar: comment.user.image || undefined,
        likeCount: comment.likeCount,
        isLiked: false,
      },
    };
  } catch (error) {
    if (error instanceof Object && "code" in error && error.code === "P2003") {
      // Foreign key constraint - video doesn't exist
      return { message: "Video not found", success: false };
    }
    console.error("Failed to create comment:", error);
    return { message: "Failed to create comment", success: false };
  }
}

export async function likeCommentAction(commentId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { message: "Unauthenticated request", success: false };
    }

    const userId = session.user.id;

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, videoId: true, likeCount: true },
    });

    if (!comment) {
      return { message: "Comment not found", success: false };
    }

    const newLikeCount =
      comment.likeCount > 0 ? comment.likeCount - 1 : comment.likeCount + 1;

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        likeCount: newLikeCount,
      },
    });

    revalidatePath(`/watch/${comment.videoId}`);

    return {
      message:
        newLikeCount > comment.likeCount ? "Comment liked" : "Like removed",
      success: true,
      likeCount: newLikeCount,
    };
  } catch (error) {
    console.error("Failed to like comment:", error);
    return { message: "Failed to like comment", success: false };
  }
}

export async function deleteCommentAction(commentId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { message: "Unauthenticated request", success: false };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find comment
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: {
          userId: true,
          videoId: true,
          createdAt: true,
        },
      });

      if (!comment) {
        throw new Error("Comment not found");
      }

      if (comment.userId !== session.user.id) {
        throw new Error("Unauthorized");
      }

      // CHECK TIME WINDOW: 2 minutes = 120 seconds
      const createdAtTime = new Date(comment.createdAt).getTime();
      const currentTime = Date.now();
      const secondsElapsed = (currentTime - createdAtTime) / 1000;
      const twoMinutes = 2 * 60;

      if (secondsElapsed > twoMinutes) {
        throw new Error(
          `Can only delete within 2 minutes. Posted ${Math.floor(secondsElapsed / 60)} minutes ago`,
        );
      }

      // Hard delete - permanent removal
      await tx.comment.delete({
        where: { id: commentId },
      });

      // Decrement video comment count
      await tx.video.update({
        where: { id: comment.videoId },
        data: { commentCount: { decrement: 1 } },
      });

      return comment.videoId;
    });

    revalidatePath(`/watch/${result}`);

    return { message: "Comment deleted successfully", success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete comment";

    if (errorMessage === "Unauthorized") {
      return {
        message: "You are not authorised to delete this comment",
        success: false,
      };
    }

    if (errorMessage === "Comment not found") {
      return { message: "Comment not found", success: false };
    }

    // Return time window error directly to user
    if (errorMessage.includes("Can only delete within 2 minutes")) {
      return { message: errorMessage, success: false };
    }

    console.error("Failed to delete comment:", error);
    return { message: "Failed to delete comment", success: false };
  }
}
