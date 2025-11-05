"use client";

import { useActionState } from "react";
import { followCreatorAction } from "@/lib/actions/follow-creator";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";

export default function FollowCreatorButton({
  creatorId,
  size,
  initialIsFollowing = false,
}: {
  creatorId: string;
  size?: "sm" | "lg";
  initialIsFollowing?: boolean;
}) {
  const [followState, followAction, isPending] = useActionState(
    async (prevState) => {
      const result = await followCreatorAction(creatorId);
      if (result.success) {
        toast.message(result.message);
      } else {
        toast.error(result.message);
      }
      return {
        isFollowing: result.success
          ? !prevState.isFollowing
          : prevState.isFollowing,
      };
    },
    { isFollowing: initialIsFollowing },
  );

  return (
    <form action={followAction}>
      <Button
        variant="default"
        size={size}
        className="ml-6"
        type="submit"
        disabled={isPending}
        onClick={(e) => e.stopPropagation()}
      >
        {followState.isFollowing ? "Unfollow" : "Follow"}
      </Button>
    </form>
  );
}
