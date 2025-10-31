import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(request: NextRequest) {
  try {
    console.log("[Bunny Webhook] Received webhook request");

    const body = await request.json();

    console.log("[Bunny Webhook] Payload:", JSON.stringify(body, null, 2));

    const { VideoGuid, Status } = body;

    if (!VideoGuid || Status === undefined) {
      console.error("[Bunny Webhook] Missing VideoGuid or Status");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    console.log(`[Bunny Webhook] Video: ${VideoGuid}, Status: ${Status}`);

    // Bunny status codes: 1=uploading, 2=transcoding, 3=ready, 4=error
    switch (Status) {
      case 1:
        console.log(`[Bunny Webhook] Video ${VideoGuid} uploading`);

        break;

      case 2:
        console.log(`[Bunny Webhook] Video ${VideoGuid} transcoding`);
        await prisma.video.updateMany({
          where: { bunnyVideoId: VideoGuid },
          data: { status: "PROCESSING" },
        });
        break;

      case 3:
        console.log(`[Bunny Webhook] Video ${VideoGuid} ready`);
        await prisma.video.updateMany({
          where: { bunnyVideoId: VideoGuid },
          data: { status: "READY" },
        });
        break;

      case 4:
        console.error(`[Bunny Webhook] Video ${VideoGuid} errored`);
        const video = await prisma.video.findFirst({
          where: { bunnyVideoId: VideoGuid },
        });
        if (video) {
          await prisma.video.delete({ where: { id: video.id } });
          console.log(`[Bunny Webhook] Deleted failed video ${video.id}`);
        }
        break;

      default:
        console.log(`[Bunny Webhook] Unknown status: ${Status}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Bunny Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
