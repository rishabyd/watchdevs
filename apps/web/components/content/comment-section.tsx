"use client";

import { useState, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { useInView } from "react-intersection-observer";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@workspace/ui/components/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { MessageSquare, ThumbsUp, Trash2 } from "@workspace/ui/icons";
import {
  createCommentAction,
  likeCommentAction,
  deleteCommentAction,
} from "@/lib/actions/comment";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  likeCount: number;
  isLiked: boolean;
}

interface CommentSectionProps {
  videoId: string;
  initialData?: Comment[];
}

export default function CommentSection({
  videoId,
  initialData,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{
    id: string;
    createdAt: string;
  } | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const { data: session } = useSession();

  const getKey = (pageIndex: number, previousPageData: Comment[] | null) => {
    if (previousPageData && previousPageData.length === 0) return null;
    return `/api/comment/get/${videoId}?page=${pageIndex}&limit=10`;
  };

  const { data, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    fetcher,
    {
      fallbackData: initialData ? [initialData] : undefined,
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      revalidateAll: false,
    },
  );

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const comments = data ? data.flat() : [];
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < 10);
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  useEffect(() => {
    if (inView && !isLoadingMore && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [inView, isLoadingMore, isReachingEnd, size, setSize]);

  const totalComments = comments.length;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createCommentAction(videoId, newComment);

      if (result.success) {
        setNewComment("");
        await mutate();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const result = await likeCommentAction(commentId);

      if (result.success) {
        await mutate();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to like comment:", error);
      toast.error("Failed to like comment");
    }
  };

  // Check if delete is still allowed (within 2 minutes)
  const canDeleteComment = (createdAt: string) => {
    const secondsOld = (Date.now() - new Date(createdAt).getTime()) / 1000;
    return secondsOld < 2 * 60; // 120 seconds
  };

  // Get remaining time for deletion
  const getTimeRemaining = (createdAt: string) => {
    const secondsOld = (Date.now() - new Date(createdAt).getTime()) / 1000;
    const remaining = 120 - Math.floor(secondsOld);
    return Math.max(0, remaining);
  };

  const handleDeleteClick = (commentId: string, createdAt: string) => {
    if (!canDeleteComment(createdAt)) {
      toast.error("Can only delete within 2 minutes of posting");
      return;
    }
    setCommentToDelete({ id: commentId, createdAt });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;

    setIsDeletingComment(true);
    try {
      const result = await deleteCommentAction(commentToDelete.id);

      if (result.success) {
        setDeleteDialogOpen(false);
        setCommentToDelete(null);
        await mutate();
        toast.success("Comment deleted");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setIsDeletingComment(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg">
          {totalComments} {totalComments === 1 ? "Comment" : "Comments"}
        </h2>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex-col flex gap-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[30px] resize-none duration-300 transition-all"
        />
        {newComment && (
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setNewComment("")}
              disabled={!newComment.trim() || isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!newComment.trim() || isSubmitting}>
              {isSubmitting ? "Posting..." : "Comment"}
            </Button>
          </div>
        )}
      </form>

      {/* Comments List */}
      <div className="space-y-2">
        {isLoading && comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading comments...
          </div>
        ) : isEmpty ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 border-b border-border last:border-0 pb-4"
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage
                    src={comment.userAvatar}
                    alt={comment.userName}
                  />
                  <AvatarFallback>
                    {comment.userName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {comment.userName}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Delete button - only show if current user owns comment AND within 2 minutes */}
                    {session?.user?.id === comment.userId &&
                      canDeleteComment(comment.createdAt) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteClick(comment.id, comment.createdAt)
                          }
                          disabled={isDeletingComment}
                          className="h-8 px-2  hover:text-destructive "
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </div>

                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeComment(comment.id)}
                      className="h-8 px-2 gap-1"
                    >
                      <ThumbsUp
                        className={`h-4 w-4 ${
                          comment.isLiked ? "fill-current" : ""
                        }`}
                      />
                      <span className="text-xs">{comment.likeCount}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading More Indicator */}
            {isLoadingMore && !isReachingEnd && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Loading more comments...
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            {!isReachingEnd && !isLoadingMore && (
              <div ref={ref} className="h-20 w-full" />
            )}

            {/* End of Comments */}
            {isReachingEnd && comments.length > 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No more comments
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The comment will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {commentToDelete && (
            <div className="text-sm text-muted-foreground">
              Time remaining: {getTimeRemaining(commentToDelete.createdAt)}{" "}
              seconds
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingComment}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-primary hover:bg-destructive hover:text-primary"
              onClick={handleConfirmDelete}
              disabled={isDeletingComment}
            >
              {isDeletingComment ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
