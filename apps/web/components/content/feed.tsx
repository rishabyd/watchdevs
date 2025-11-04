"use client";

import useSWRInfinite from "swr/infinite";
import VideoCard from "@/components/content/video-card";
import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { useSession } from "@/lib/auth-client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function FeedClient({ initialData }: { initialData: any[] }) {
  const getKey = (pageIndex: number, previousPageData: any) => {
    // Reached the end
    if (previousPageData && previousPageData.length === 0) return null;

    return `/api/videos/feed?page=${pageIndex}`;
  };
  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(
    getKey,
    fetcher,
    {
      fallbackData: [initialData],
      revalidateOnFocus: true,
      revalidateOnMount: false,
    },
  );

  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const isLoadingMore = isLoading || isValidating;

  useEffect(() => {
    if (inView && !isLoadingMore) {
      setSize((prevSize) => prevSize + 1);
    }
  }, [inView, isLoadingMore, setSize]);

  const videos = data ? data.flat() : [];
  const isEmpty = videos.length === 0;
  const isReachingEnd = data && data[data.length - 1]?.length < 20;

  return (
    <>
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <VideoCard
            viewMode="square"
            creatorAvatar={video.creatorAvatar}
            key={video.id}
            creatorUsername={video.creatorUsername}
            id={video.id}
            thumbnailKey={video.thumbnailKey}
            title={video.title}
            creatorId={video.creatorId}
            creatorName={video.creatorName}
            userId={video.creatorId}
            duration={video.duration}
            viewCount={video.viewCount}
            createdAt={video.createdAt}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoadingMore && !isReachingEnd && (
        <div className="text-center py-8 text-muted-foreground">
          Loading more videos...
        </div>
      )}

      {/* Infinite scroll trigger - only show if not at end */}
      {!isReachingEnd && <div ref={ref} className="h-20" />}

      {/* End of feed message */}
      {isReachingEnd && videos.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          You've reached the end
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !isLoadingMore && (
        <div className="text-center py-12 text-muted-foreground">
          No videos available yet
        </div>
      )}
    </>
  );
}
