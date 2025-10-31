"use client";

import { Button } from "@workspace/ui/components/button";
import { Github, Star, Banknote } from "@workspace/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  profileUsername: string | null;
  githubUsername: string | null;
  image: string | null;
}

export function CreatorCard({ user }: { user: User }) {
  const router = useRouter();

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
      </div>
      <Button variant="default" onClick={(e) => e.stopPropagation()}>
        Follow
      </Button>
      <Button
        title="I like this"
        className="ml-auto"
        variant="outline"
        onClick={(e) => e.stopPropagation()}
      >
        <Star />
      </Button>
      <Button
        title="Support the creator"
        className=""
        variant="outline"
        onClick={(e) => e.stopPropagation()}
      >
        <Banknote />
        {"Support"}
      </Button>
      {user.githubUsername && (
        <Link
          href={`https://github.com/${user.githubUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className=""
        >
          <Button variant="outline" title="Creator's github">
            <Github />
            {user.githubUsername}
          </Button>
        </Link>
      )}
    </div>
  );
}
