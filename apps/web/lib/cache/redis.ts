import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache keys
export const CACHE_KEYS = {
  videoFeed: (page: number) => `feed:videos:page:${page}`,
  video: (id: string) => `video:${id}`,
  trending: "feed:trending",
};
