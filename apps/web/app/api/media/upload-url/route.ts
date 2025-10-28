import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
    const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      return Response.json(
        { error: "Mux credentials not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();

    await prisma.video.create({
      data: {
        muxAssetId: "",
        userId: session.user.id,
        visibility: body.visibility,
        status: "PENDING",
        title: body.title,
        thumbnailUrl: body.thumbnailUrl ?? "",
        description: body.description,
      },
    });

    const response = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)}`,
      },
      body: JSON.stringify({
        new_asset_settings: {
          playback_policies: ["public"],
          video_quality: "basic",
        },
        cors_origin: "*",
        test: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Mux API error:", error);
      return Response.json(
        { error: "Failed to create upload URL" },
        { status: response.status },
      );
    }

    const data = await response.json();

    return Response.json({
      uploadUrl: data.data.url,
      assetId: data.data.id,
    });
  } catch (error) {
    console.error("Upload URL creation failed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
