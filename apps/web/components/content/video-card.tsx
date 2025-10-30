import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components/card";
import { formatDistanceToNowStrict } from "date-fns";

interface VideoCardProps {
  id: string;
  thumbnailKey: string | null;
  title: string;
  description?: string | null;
  creatorId: string;
  creatorUsername: string;
  creatorName?: string;
  playbackId: string | null;
  userId: string;
  duration?: number | null;
  viewCount?: bigint;
  createdAt: Date;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatViews(views: bigint): string {
  const num = Number(views);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default function VideoCard({
  id,
  thumbnailKey,
  title,
  description,
  creatorName,
  duration,
  viewCount = 0n,
  createdAt,
}: VideoCardProps) {
  const thumbnailUrl = thumbnailKey
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${thumbnailKey}`
    : "/placeholder-thumbnail.jpg";

  return (
    <Link href={`/watch/${id}`}>
      <Card className="rounded-none p-3   overflow-hidden hover:bg-accent/70 duration-300 hover:shadow-lg gap-2 shadow-2xl transition-all cursor-pointer focus:scale-200">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full bg-muted">
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {formatDuration(duration)}
            </div>
          )}
        </div>

        <CardContent className=" px-2">
          {/* Title */}
          <CardTitle className="text-base font-mono line-clamp-2 mb-1">
            {title}
          </CardTitle>

          {/* Creator name */}
          {creatorName && (
            <CardDescription className="text-sm text-muted-foreground">
              {creatorName}
            </CardDescription>
          )}

          {/* Views and date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{formatViews(viewCount)} views</span>
            <span>•</span>
            <span>
              {formatDistanceToNowStrict(new Date(createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
