import { auth } from "@/lib/auth";
import { prisma } from "@/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const topups = await prisma.transaction.findMany({
      where: { userId: session.user.id, type: "TOPUP" },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        paymentAmountUsd: true,
        gatewayTransactionId: true,
        amountCredits: true,
        runningBalanceCredits: true,
        createdAt: true,
      },
    });

    const safe = {
      topups: topups.map((t) => ({
        id: String(t.id),
        paymentAmountUsd: t.paymentAmountUsd ?? 0,
        gatewayTransactionId: t.gatewayTransactionId ?? null,
        amountCredits: t.amountCredits.toString(),
        runningBalanceCredits: t.runningBalanceCredits.toString(),
        createdAt: t.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(safe, { status: 200 });
  } catch (err) {
    console.error("GET /api/wallet/topups failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
