import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const videos = await prisma.video.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { profileUsername: { contains: q, mode: "insensitive" } } },
        { category: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: [q] } },
      ],
    },
    select: {
      id: true,
      title: true,
      user: { select: { name: true } },
    },
    take: 20,
  });

  return NextResponse.json({ results: videos });
}
