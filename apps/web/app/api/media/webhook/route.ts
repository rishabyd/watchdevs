import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { prisma } from "@repo/db";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
  webhookSecret: process.env.MUX_WEBHOOK_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    console.log("[Mux Webhook] Received webhook request");

    // Get raw body
    const body = await request.text();

    // Get all headers as an object
    const headersList: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersList[key] = value;
    });

    // Verify and unwrap webhook using the new method
    let event;
    try {
      // Use mux.webhooks.unwrap - this verifies signature AND parses body
      event = mux.webhooks.unwrap(body, headersList);
      console.log("[Mux Webhook] Signature verified ✓");
    } catch (error) {
      console.error("[Mux Webhook] Signature verification failed:", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(`[Mux Webhook] Event type: ${event.type}`);
    console.log(`[Mux Webhook] Data:`, JSON.stringify(event.data, null, 2));

    // Handle different webhook events
    switch (event.type) {
      case "video.upload.asset_created":
        console.log(
          `[Mux Webhook] Upload ${event.data.id} created asset ${event.data.asset_id}`,
        );

        const uploadVideo = await prisma.video.findFirst({
          where: { muxUploadId: event.data.id },
        });

        if (!uploadVideo) {
          console.error(
            `[Mux Webhook] Video not found for upload ID: ${event.data.id}`,
          );
          break;
        }

        try {
          const asset = await mux.video.assets.retrieve(event.data.asset_id!);
          const playbackId = asset.playback_ids?.[0]?.id;

          await prisma.video.update({
            where: { id: uploadVideo.id },
            data: {
              muxAssetId: event.data.asset_id,
              muxPlaybackId: playbackId || null,
              status: "PROCESSING",
            },
          });

          console.log(
            `[Mux Webhook] Updated video ${uploadVideo.id}: assetId=${event.data.asset_id}, playbackId=${playbackId}`,
          );
        } catch (error) {
          console.error(`[Mux Webhook] Failed to fetch asset:`, error);

          await prisma.video.update({
            where: { id: uploadVideo.id },
            data: {
              muxAssetId: event.data.asset_id,
              status: "PROCESSING",
            },
          });
        }
        break;

      case "video.asset.ready":
        console.log(`[Mux Webhook] Asset ${event.data.id} is ready`);

        try {
          const asset = await mux.video.assets.retrieve(event.data.id);
          const playbackId = asset.playback_ids?.[0]?.id;

          if (!playbackId) {
            console.error(
              `[Mux Webhook] No playback ID found for asset ${event.data.id}`,
            );
            break;
          }

          const readyVideo = await prisma.video.findFirst({
            where: { muxAssetId: event.data.id },
          });

          if (!readyVideo) {
            console.error(
              `[Mux Webhook] Video not found for asset ID: ${event.data.id}`,
            );
            break;
          }

          await prisma.video.update({
            where: { id: readyVideo.id },
            data: {
              status: "READY",
              muxPlaybackId: playbackId,
              duration: Math.floor(asset.duration || 0),
            },
          });

          console.log(
            `[Mux Webhook] Video ${readyVideo.id} is READY: playbackId=${playbackId}, duration=${asset.duration}s`,
          );
        } catch (error) {
          console.error(`[Mux Webhook] Failed to process ready event:`, error);
        }
        break;

      case "video.upload.errored":
        console.error(`[Mux Webhook] Upload errored: ${event.data.id}`);

        const erroredUpload = await prisma.video.findFirst({
          where: { muxUploadId: event.data.id },
        });

        if (erroredUpload) {
          await prisma.video.delete({
            where: { id: erroredUpload.id },
          });
          console.log(
            `[Mux Webhook] Deleted failed upload video ${erroredUpload.id}`,
          );
        }
        break;

      case "video.asset.errored":
        console.error(`[Mux Webhook] Asset errored: ${event.data.id}`);

        const erroredAsset = await prisma.video.findFirst({
          where: { muxAssetId: event.data.id },
        });

        if (erroredAsset) {
          await prisma.video.delete({
            where: { id: erroredAsset.id },
          });
          console.log(
            `[Mux Webhook] Deleted errored asset video ${erroredAsset.id}`,
          );
        }
        break;

      case "video.upload.cancelled":
        console.log(`[Mux Webhook] Upload cancelled: ${event.data.id}`);

        const cancelledUpload = await prisma.video.findFirst({
          where: { muxUploadId: event.data.id },
        });

        if (cancelledUpload) {
          await prisma.video.delete({
            where: { id: cancelledUpload.id },
          });
          console.log(
            `[Mux Webhook] Deleted cancelled upload video ${cancelledUpload.id}`,
          );
        }
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
