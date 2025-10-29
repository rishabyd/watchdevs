import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
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
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

    if (webhookSecret) {
      try {
        Mux.Webhooks.verifyHeader(body, signature, webhookSecret);
        console.log("[Mux Webhook] Signature verified ✓");
      } catch (error) {
        console.error("[Mux Webhook] Signature verification failed:", error);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    } else {
      console.warn(
        "[Mux Webhook] No webhook secret configured, skipping verification",
      );
    }

    // Parse the event
    const event = JSON.parse(body);
    console.log(`[Mux Webhook] Event type: ${event.type}`);
    console.log(`[Mux Webhook] Data:`, JSON.stringify(event.data, null, 2));

    // Handle different webhook events
    switch (event.type) {
      case "video.upload.asset_created":
        // Video uploaded, asset created
        // event.data.id = upload ID
        // event.data.asset_id = new asset ID
        console.log(
          `[Mux Webhook] Upload ${event.data.id} created asset ${event.data.asset_id}`,
        );

        // Find by upload ID, update with asset ID
        const uploadVideo = await prisma.video.findFirst({
          where: { muxUploadId: event.data.id },
        });

        if (!uploadVideo) {
          console.error(
            `[Mux Webhook] Video not found for upload ID: ${event.data.id}`,
          );
          break;
        }

        // Fetch asset to get playback ID
        try {
          const asset = await mux.video.assets.retrieve(event.data.asset_id);
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

          // Still update with asset ID even if we can't get playback ID yet
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
        // Video encoding complete, ready to play
        // event.data.id = asset ID
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
              muxAssetId: asset.id,
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
        // Upload failed
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
        // Processing failed
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
        // User cancelled upload
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
