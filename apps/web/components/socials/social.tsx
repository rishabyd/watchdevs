import { Button } from "@workspace/ui/components/button";
import { Github } from "@workspace/ui/icons";
import Link from "next/link";

export default function GithubButton({
  githubUsername,
  size,
}: {
  githubUsername: string;
  size?: "sm" | "lg";
}) {
  return (
    <Link
      href={`https://github.com/${githubUsername}`}
      target="_blank"
      rel="noopener noreferrer"
      className=""
    >
      <Button variant="outline" size={size} title="Creator's github">
        <Github />
        {githubUsername}
      </Button>
    </Link>
  );
}
