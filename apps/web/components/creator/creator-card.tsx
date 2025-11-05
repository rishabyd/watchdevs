"use client";

import { followCreatorAction } from "@/lib/actions/follow-creator";
import { likeVideoAction } from "@/lib/actions/like-video";
import { Button } from "@workspace/ui/components/button";
import { Github, Star, Banknote, Flag } from "@workspace/ui/icons";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  profileUsername: string | null;
  githubUsername: string | null;
  image: string | null;
  _count: { followers: number };
}

export function CreatorCard({
  user,
  videoId,
  likeCount: initialLikeCount,
  isLiked: initialIsLiked,
}: {
  user: User;
  videoId: string;
  likeCount: number;
  isLiked: boolean;
}) {
  const router = useRouter();

  // Like button state management
  const [likeState, likeAction, isLikePending] = useActionState(
    async (prevState: { liked: boolean; count: number }) => {
      await likeVideoAction(videoId);

      return {
        liked: !prevState.liked,
        count: prevState.liked ? prevState.count - 1 : prevState.count + 1,
      };
    },
    { liked: initialIsLiked, count: initialLikeCount },
  );

  return (
    <div
      onClick={() =>
        user.profileUsername && router.push(`/${user.profileUsername}`)
      }
      className="flex items-center px-4 border gap-3 p-2 cursor-pointer"
    >
      {user.image && (
        <img
          src={user.image}
          alt={user.name || ""}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div className="flex-col gap-0">
        <p className="font-medium text-lg p-0">{user.name}</p>
        <p className="text-muted-foreground text-xs p-0">
          {user._count.followers} followers
        </p>
      </div>
      <Button
        variant="default"
        className="ml-6"
        onClick={async (e) => {
          e.stopPropagation();
          const res = await followCreatorAction(user.id);
          res.success ? toast.message(res.message) : toast.error(res.message);
        }}
      >
        Follow
      </Button>
      <form
        action={likeAction}
        className="ml-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          title="I like this"
          variant="outline"
          type="submit"
          disabled={isLikePending}
        >
          {likeState.liked ? (
            <Star
              className="text-foreground"
              fill="currentColor"
              stroke="currentColor"
            />
          ) : (
            <Star />
          )}{" "}
          {likeState.count}
        </Button>
      </form>
      <Button
        title="Report this video"
        className=""
        variant="outline"
        onClick={(e) => e.stopPropagation()}
      >
        <Flag /> Report
      </Button>
    </div>
  );
}
