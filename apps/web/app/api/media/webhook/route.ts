import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    console.log("[Mux Webhook] Received webhook request");

    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get("mux-signature");

    if (!signature) {
      console.error("[Mux Webhook] No signature header found");
      return NextResponse.json({ error: "No signature" }, { status: 401 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET!;

    try {
      Mux.Webhooks.verifyHeader(body, signature, webhookSecret);
      console.log("[Mux Webhook] Signature verified ✓");
    } catch (error) {
      console.error("[Mux Webhook] Signature verification failed:", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the event
    const event = JSON.parse(body);
    console.log(`[Mux Webhook] Event type: ${event.type}`);
    console.log(`[Mux Webhook] Asset ID: ${event.data.id}`);

    // Handle different webhook events
    switch (event.type) {
      case "video.upload.asset_created":
        // Video uploaded, now processing
        console.log(
          `[Mux Webhook] Upload completed for asset ${event.data.id}`,
        );

        await prisma.video.updateMany({
          where: { muxAssetId: event.data.id },
          data: {
            status: "PROCESSING",
            updatedAt: new Date(),
          },
        });

        console.log(`[Mux Webhook] Status updated to PROCESSING`);
        break;

      case "video.asset.ready":
        // Video encoding complete, ready to play
        console.log(`[Mux Webhook] Asset ${event.data.id} is ready`);

        try {
          const asset = await mux.video.assets.retrieve(event.data.id);
          const playbackId = asset.playback_ids?.[0]?.id;

          if (!playbackId) {
            throw new Error("No playback ID found");
          }

          await prisma.video.updateMany({
            where: { muxAssetId: event.data.id },
            data: {
              status: "READY",
              playbackId: playbackId,
              duration: asset.duration || 0,
              thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.webp?width=640&height=360`,
              updatedAt: new Date(),
            },
          });

          console.log(
            `[Mux Webhook] Status updated to READY with playbackId: ${playbackId}`,
          );
        } catch (error) {
          console.error(`[Mux Webhook] Failed to process ready event:`, error);
        }
        break;

      case "video.upload.errored":
        // Upload failed
        console.error(
          `[Mux Webhook] Upload errored for asset ${event.data.id}`,
        );

        await prisma.video.deleteMany({
          where: { muxAssetId: event.data.id },
        });

        console.log(`[Mux Webhook] Deleted failed video from database`);
        break;

      case "video.asset.errored":
        // Processing failed
        console.error(`[Mux Webhook] Asset errored: ${event.data.id}`);

        await prisma.video.deleteMany({
          where: { muxAssetId: event.data.id },
        });

        console.log(`[Mux Webhook] Deleted errored asset from database`);
        break;

      case "video.upload.cancelled":
        // User cancelled upload
        console.log(`[Mux Webhook] Upload cancelled: ${event.data.id}`);

        await prisma.video.deleteMany({
          where: { muxAssetId: event.data.id },
        });

        console.log(`[Mux Webhook] Deleted cancelled upload from database`);
        break;

      default:
        console.log(`[Mux Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Mux Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
