import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components/card";
import { formatDistanceToNowStrict } from "date-fns";
import formatViews from "@/utils/format/format-views";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";

interface VideoCardProps {
  id: string;
  thumbnailKey: string | null;
  title: string;
  description?: string | null;
  creatorId: string;
  creatorUsername: string;
  creatorName?: string;
  hlsUrl?: string;
  viewMode: "square" | "rectangle";
  userId: string;
  duration?: number | null;
  viewCount?: bigint;
  createdAt: string;
  creatorAvatar: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function VideoCard({
  id,
  thumbnailKey,
  title,
  description,
  creatorName,
  creatorId,
  duration,
  viewCount = 0n,
  createdAt,
  creatorUsername,
  viewMode,
  creatorAvatar,
}: VideoCardProps) {
  const thumbnailUrl = thumbnailKey
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${thumbnailKey}`
    : "/placeholder-thumbnail.jpg";

  if (viewMode === "rectangle") {
    return (
      <Card className=" p-0 overflow-hidden  duration-300 hover:shadow-lg shadow-none transition-all  border-0">
        <div className="flex p-3">
          {/* Thumbnail */}
          <div className="relative cursor-pointer aspect-video flex-2/5 w-full bg-muted">
            <Link href={`/watch/${id}`}>
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
            </Link>
          </div>

          {/* Content */}
          <CardContent className=" p-4   flex  flex-3/5 flex-col justify-between">
            <Link href={`/watch/${id}`} className="cursor-pointer">
              <CardTitle className="text-2xl font-semibold line-clamp-2">
                {title}
              </CardTitle>
              {description && (
                <p className="text-lg text-muted-foreground line-clamp-1 mt-1">
                  {description}
                </p>
              )}
              {/* Meta */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <span>{formatViews(viewCount)} views</span>
                <span>•</span>
                <span>
                  {formatDistanceToNowStrict(new Date(createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </Link>

            {creatorName && (
              <Link href={`/${creatorUsername}`}>
                <div className="flex items-center cursor-pointer gap-2 mt-3  w-fit p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={creatorAvatar} alt={creatorName} />
                    <AvatarFallback className="rounded-full">
                      {creatorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-lg text-muted-foreground">
                    {creatorName}
                  </span>
                </div>
              </Link>
            )}
          </CardContent>
        </div>
      </Card>
    );
  }

  // Square view (default)
  return (
    <Card className="p-0 gap-0 overflow-hidden hover:shadow-lg duration-300 shadow-none transition-all cursor-pointer border-0">
      {/* Thumbnail - Clickable to video */}
      <Link href={`/watch/${id}`}>
        <div className="relative  aspect-video w-full  bg-muted hover:opacity-80 transition-opacity">
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
      </Link>

      <CardContent className="p-3">
        {/* Title - Clickable to video */}
        <Link href={`/watch/${id}`}>
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {title}
          </CardTitle>
        </Link>

        {/* Views and date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <span>{formatViews(viewCount)} views</span>
          <span>•</span>
          <span>
            {formatDistanceToNowStrict(new Date(createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Creator - Clickable to profile */}
        {creatorName && (
          <Link
            href={`/${creatorUsername}`}
            className="hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2 mt-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={creatorAvatar} alt={creatorName} />
                <AvatarFallback>{creatorName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground ">
                {creatorName}
              </span>
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
